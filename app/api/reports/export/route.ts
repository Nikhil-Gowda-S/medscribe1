import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') || '30', 10)));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const consultations = await prisma.consultation.findMany({
      where: {
        doctorId: session.user.id,
        consultationDate: { gte: startDate },
      },
      include: {
        patient: { select: { firstName: true, lastName: true, medicalRecordNumber: true } },
        _count: { select: { documents: true } },
      },
      orderBy: { consultationDate: 'desc' },
    });

    if (format === 'csv') {
      const header = 'Date,Patient Name,MRN,Status,Documents Generated\n';
      const rows = consultations.map(
        (c) =>
          `${new Date(c.consultationDate).toISOString().split('T')[0]},"${c.patient.firstName} ${c.patient.lastName}",${c.patient.medicalRecordNumber ?? ''},${c.status},${c._count.documents}`
      );
      const csv = header + rows.join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="medscribe-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      rangeDays: days,
      generatedAt: new Date().toISOString(),
      consultations: consultations.map((c) => ({
        date: c.consultationDate,
        patientName: `${c.patient.firstName} ${c.patient.lastName}`,
        mrn: c.patient.medicalRecordNumber,
        status: c.status,
        documentsCount: c._count.documents,
      })),
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    );
  }
}
