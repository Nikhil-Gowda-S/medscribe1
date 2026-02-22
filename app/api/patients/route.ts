import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const patientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  medicalRecordNumber: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const phone = searchParams.get('phone');
    const mrn = searchParams.get('mrn');
    const dob = searchParams.get('dob');

    const where: Record<string, unknown> = { doctorId: session.user.id };

    if (search?.trim()) {
      where.OR = [
        { firstName: { contains: search.trim(), mode: 'insensitive' } },
        { lastName: { contains: search.trim(), mode: 'insensitive' } },
        { medicalRecordNumber: { contains: search.trim(), mode: 'insensitive' } },
        { phone: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }
    if (phone?.trim()) {
      where.phone = { contains: phone.trim(), mode: 'insensitive' };
    }
    if (mrn?.trim()) {
      where.medicalRecordNumber = { contains: mrn.trim(), mode: 'insensitive' };
    }
    if (dob) {
      const d = new Date(dob);
      if (!isNaN(d.getTime())) {
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        where.dateOfBirth = { gte: start, lte: end };
      }
    }

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
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
    const data = patientSchema.parse(body);

    const patient = await prisma.patient.create({
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        doctorId: session.user.id,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: 'create_patient',
      entityType: 'Patient',
      entityId: patient.id,
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: message || 'Invalid input' }, { status: 400 });
    }
    // Prisma unique constraint (medical record number already exists)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'A patient with this medical record number already exists' },
        { status: 400 }
      );
    }
    // Prisma / DB errors
    if (error && typeof error === 'object' && 'message' in error) {
      console.error('Error creating patient:', error);
      const msg = (error as { message: string }).message;
      if (msg.includes('connect') || msg.includes('Connection')) {
        return NextResponse.json(
          { error: 'Cannot connect to database. Check DATABASE_URL and that PostgreSQL is running.' },
          { status: 503 }
        );
      }
    }
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}
