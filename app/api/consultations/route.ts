import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const consultationSchema = z.object({
  patientId: z.string(),
  transcript: z.string().optional(),
  status: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = { doctorId: session.user.id };
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    if (search?.trim()) {
      where.transcript = { contains: search.trim(), mode: 'insensitive' };
    }

    const consultations = await prisma.consultation.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            medicalRecordNumber: true,
          },
        },
      },
      orderBy: {
        consultationDate: 'desc',
      },
    });

    return NextResponse.json(consultations);
  } catch (error) {
    console.error('Error fetching consultations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consultations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = consultationSchema.parse(body);

    // Verify patient belongs to doctor
    const patient = await prisma.patient.findFirst({
      where: {
        id: data.patientId,
        doctorId: session.user.id,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    const consultation = await prisma.consultation.create({
      data: {
        patientId: data.patientId,
        doctorId: session.user.id,
        transcript: data.transcript,
        status: data.status || 'in_progress',
      },
      include: {
        patient: true,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: 'create_consultation',
      entityType: 'Consultation',
      entityId: consultation.id,
      details: { patientId: data.patientId },
    });

    return NextResponse.json(consultation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating consultation:', error);
    return NextResponse.json(
      { error: 'Failed to create consultation' },
      { status: 500 }
    );
  }
}
