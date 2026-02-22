import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.consultation.findFirst({
      where: {
        id: params.id,
        doctorId: session.user.id,
      },
      include: { patient: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
    }

    const consultation = await prisma.consultation.create({
      data: {
        patientId: existing.patientId,
        doctorId: session.user.id,
        transcript: null,
        status: 'draft',
        consultationDate: new Date(),
      },
      include: { patient: true },
    });

    await logAudit({
      userId: session.user.id,
      action: 'clone_consultation',
      entityType: 'Consultation',
      entityId: consultation.id,
      details: { sourceConsultationId: params.id },
    });

    return NextResponse.json(consultation, { status: 201 });
  } catch (error) {
    console.error('Error cloning consultation:', error);
    return NextResponse.json(
      { error: 'Failed to clone consultation' },
      { status: 500 }
    );
  }
}
