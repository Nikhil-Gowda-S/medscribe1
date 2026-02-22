import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { Users, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const [patientCount, consultationCount, recentConsultations] = await Promise.all([
    prisma.patient.count({
      where: { doctorId: session.user.id },
    }),
    prisma.consultation.count({
      where: { doctorId: session.user.id },
    }),
    prisma.consultation.findMany({
      where: { doctorId: session.user.id },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { consultationDate: 'desc' },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {session.user.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {patientCount}
              </p>
            </div>
            <Users className="w-12 h-12 text-primary-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Consultations</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {consultationCount}
              </p>
            </div>
            <FileText className="w-12 h-12 text-primary-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recent Activity</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {recentConsultations.length}
              </p>
            </div>
            <Calendar className="w-12 h-12 text-primary-600" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Quick Actions">
          <div className="space-y-3">
            <Link href="/dashboard/patients/new">
              <Button className="w-full" variant="primary">
                Add New Patient
              </Button>
            </Link>
            <Link href="/dashboard/consultations/new">
              <Button className="w-full" variant="outline">
                Start New Consultation
              </Button>
            </Link>
            <a href="/api/reports/export?format=csv&days=30" download>
              <Button className="w-full" variant="outline" type="button">
                Export Report (CSV)
              </Button>
            </a>
          </div>
        </Card>

        <Card title="Recent Consultations">
          {recentConsultations.length === 0 ? (
            <p className="text-gray-500 text-sm">No consultations yet</p>
          ) : (
            <div className="space-y-3">
              {recentConsultations.map((consultation) => (
                <Link
                  key={consultation.id}
                  href={`/dashboard/consultations/${consultation.id}`}
                  className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {consultation.patient.firstName}{' '}
                        {consultation.patient.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(consultation.consultationDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        consultation.status === 'finalized'
                          ? 'bg-green-100 text-green-800'
                          : consultation.status === 'draft'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {consultation.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
