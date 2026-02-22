import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit, CONSULTATION_STATUSES } from '@/lib/audit';
import { notifyDocumentFinalized } from '@/lib/webhooks';
import { z } from 'zod';

const consultationUpdateSchema = z.object({
  transcript: z.string().optional(),
  status: z.enum(CONSULTATION_STATUSES).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const consultation = await prisma.consultation.findFirst({
      where: {
        id: params.id,
        doctorId: session.user.id,
      },
      include: {
        patient: true,
        documents: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(consultation);
  } catch (error) {
    console.error('Error fetching consultation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consultation' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = consultationUpdateSchema.parse(body);

    await logAudit({
      userId: session.user.id,
      action: 'update_consultation',
      entityType: 'Consultation',
      entityId: params.id,
      details: { fields: Object.keys(data) },
    });

    const prev = await prisma.consultation.findFirst({
      where: { id: params.id, doctorId: session.user.id },
      include: { documents: true },
    });

    const consultation = await prisma.consultation.updateMany({
      where: {
        id: params.id,
        doctorId: session.user.id,
      },
      data,
    });

    if (data.status === 'finalized' && prev?.status !== 'finalized' && prev?.documents?.length) {
      for (const doc of prev.documents) {
        await notifyDocumentFinalized({
          consultationId: params.id,
          documentId: doc.id,
          type: doc.type,
          doctorId: session.user.id,
        });
      }
    }

    if (consultation.count === 0) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    const updatedConsultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
      },
    });

    return NextResponse.json(updatedConsultation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating consultation:', error);
    return NextResponse.json(
      { error: 'Failed to update consultation' },
      { status: 500 }
    );
  }
}
