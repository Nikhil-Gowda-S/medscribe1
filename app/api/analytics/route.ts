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
    const range = searchParams.get('range') || '30'; // days
    const days = Math.min(365, Math.max(1, parseInt(range, 10) || 30));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const [consultationsByDay, documentCount, consultationCount, recentActivity] = await Promise.all([
      prisma.consultation.groupBy({
        by: ['consultationDate'],
        where: {
          doctorId: session.user.id,
          consultationDate: { gte: startDate },
        },
        _count: true,
      }),
      prisma.document.count({
        where: {
          doctorId: session.user.id,
          createdAt: { gte: startDate },
        },
      }),
      prisma.consultation.count({
        where: {
          doctorId: session.user.id,
          consultationDate: { gte: startDate },
        },
      }),
      prisma.consultation.findMany({
        where: { doctorId: session.user.id },
        include: {
          patient: { select: { firstName: true, lastName: true } },
        },
        orderBy: { consultationDate: 'desc' },
        take: 10,
      }),
    ]);

    const byDay: Record<string, number> = {};
    consultationsByDay.forEach((g) => {
      const key = new Date(g.consultationDate).toISOString().split('T')[0];
      byDay[key] = g._count;
    });

    return NextResponse.json({
      rangeDays: days,
      consultationsInRange: consultationCount,
      documentsGeneratedInRange: documentCount,
      consultationsByDay: byDay,
      recentActivity: recentActivity.map((c) => ({
        id: c.id,
        date: c.consultationDate,
        patientName: `${c.patient.firstName} ${c.patient.lastName}`,
        status: c.status,
      })),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
