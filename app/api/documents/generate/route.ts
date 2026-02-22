import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateDischargeSummary, generateCaseSheet } from '@/lib/openai';
import { calculateAge } from '@/lib/utils';
import { logAudit } from '@/lib/audit';
import { rateLimitDocumentGenerate } from '@/lib/rate-limit';
import { canAccessSensitiveAction } from '@/lib/rbac';
import { substituteTemplateVariables } from '@/lib/template-vars';
import { z } from 'zod';

const generateSchema = z.object({
  consultationId: z.string(),
  type: z.enum(['discharge_summary', 'case_sheet']),
  template: z.string().optional(), // specialty key (e.g. cardiology) or custom template ID
  includeIcd10: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canAccessSensitiveAction(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const limit = rateLimitDocumentGenerate(session.user.id);
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many document generation requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { consultationId, type, template, includeIcd10 } = generateSchema.parse(body);

    // Fetch consultation with patient data
    const consultation = await prisma.consultation.findFirst({
      where: {
        id: consultationId,
        doctorId: session.user.id,
      },
      include: {
        patient: true,
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    if (!consultation.transcript) {
      return NextResponse.json(
        { error: 'Consultation transcript is required' },
        { status: 400 }
      );
    }

    const patientInfo = {
      name: `${consultation.patient.firstName} ${consultation.patient.lastName}`,
      age: calculateAge(consultation.patient.dateOfBirth),
      gender: consultation.patient.gender,
      medicalRecordNumber: consultation.patient.medicalRecordNumber || undefined,
    };

    let customTemplateInstruction: string | undefined;
    if (template && template.length >= 20) {
      const customTemplate = await prisma.documentTemplate.findFirst({
        where: {
          id: template,
          type,
          OR: [
            { doctorId: session.user.id },
            { doctorId: null },
          ],
        },
      });
      if (customTemplate?.body) {
        customTemplateInstruction = substituteTemplateVariables(customTemplate.body, {
          patientName: patientInfo.name,
          patientAge: patientInfo.age,
          patientGender: patientInfo.gender,
          medicalRecordNumber: patientInfo.medicalRecordNumber,
          consultationDate: consultation.consultationDate,
        });
      }
    }

    const opts = {
      includeIcd10: includeIcd10 ?? false,
      customTemplateInstruction: customTemplateInstruction ?? undefined,
    };

    // Generate document based on type from transcript
    let content: string;
    if (type === 'discharge_summary') {
      content = await generateDischargeSummary(
        consultation.transcript,
        patientInfo,
        template,
        opts
      );
    } else {
      content = await generateCaseSheet(
        consultation.transcript,
        patientInfo,
        template,
        opts
      );
    }

    // Save document to database
    const document = await prisma.document.create({
      data: {
        consultationId,
        doctorId: session.user.id,
        type,
        template: template || null,
        content,
      },
      include: {
        consultation: {
          include: {
            patient: true,
          },
        },
      },
    });

    await logAudit({
      userId: session.user.id,
      action: 'generate_document',
      entityType: 'Document',
      entityId: document.id,
      details: { consultationId, type, template: template ?? null },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: message || 'Invalid input' }, { status: 400 });
    }
    console.error('Error generating document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate document';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
