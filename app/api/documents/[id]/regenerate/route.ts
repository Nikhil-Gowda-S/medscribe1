import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { regenerateDischargeSummary, regenerateCaseSheet } from '@/lib/openai';
import { calculateAge } from '@/lib/utils';
import { logAudit } from '@/lib/audit';
import { rateLimitDocumentGenerate } from '@/lib/rate-limit';
import { canAccessSensitiveAction } from '@/lib/rbac';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        doctorId: session.user.id,
      },
      include: {
        consultation: { include: { patient: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const patientInfo = {
      name: `${document.consultation.patient.firstName} ${document.consultation.patient.lastName}`,
      age: calculateAge(document.consultation.patient.dateOfBirth),
      gender: document.consultation.patient.gender,
      medicalRecordNumber: document.consultation.patient.medicalRecordNumber || undefined,
    };

    const content =
      document.type === 'discharge_summary'
        ? await regenerateDischargeSummary(
            patientInfo,
            document.content,
            document.template ?? undefined
          )
        : await regenerateCaseSheet(
            patientInfo,
            document.content,
            document.template ?? undefined
          );

    const updated = await prisma.document.update({
      where: { id: params.id },
      data: { content, updatedAt: new Date() },
      include: {
        consultation: { include: { patient: true } },
      },
    });

    await logAudit({
      userId: session.user.id,
      action: 'update_document',
      entityType: 'Document',
      entityId: document.id,
      details: { regenerate: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error regenerating document:', error);
    const msg = error instanceof Error ? error.message : 'Failed to regenerate document';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
