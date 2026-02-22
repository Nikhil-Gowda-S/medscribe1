'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BarChart3, Download, FileText, Calendar } from 'lucide-react';

interface Analytics {
  rangeDays: number;
  consultationsInRange: number;
  documentsGeneratedInRange: number;
  consultationsByDay: Record<string, number>;
  recentActivity: Array<{
    id: string;
    date: string;
    patientName: string;
    status: string;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  useEffect(() => {
    fetch(`/api/analytics?range=${range}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, [range]);

  const handleExportReport = () => {
    window.open(`/api/reports/export?format=csv&days=${range}`, '_blank');
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <Card>
          <div className="text-center py-12 text-gray-500">Loading analytics...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Usage and activity overview</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            aria-label="Date range"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button variant="outline" onClick={handleExportReport} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Consultations</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {data.consultationsInRange}
              </p>
              <p className="text-xs text-gray-500 mt-1">in last {data.rangeDays} days</p>
            </div>
            <Calendar className="w-12 h-12 text-primary-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Documents Generated</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {data.documentsGeneratedInRange}
              </p>
              <p className="text-xs text-gray-500 mt-1">in last {data.rangeDays} days</p>
            </div>
            <FileText className="w-12 h-12 text-primary-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Time saved (est.)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ~{Math.round(data.documentsGeneratedInRange * 5)} min
              </p>
              <p className="text-xs text-gray-500 mt-1">~5 min per document</p>
            </div>
            <BarChart3 className="w-12 h-12 text-primary-600" />
          </div>
        </Card>
      </div>

      <Card title="Recent Activity">
        {data.recentActivity.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent activity</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {data.recentActivity.map((item) => (
              <li key={item.id} className="py-2 flex justify-between text-sm">
                <span className="font-medium text-gray-900">{item.patientName}</span>
                <span className="text-gray-500">
                  {new Date(item.date).toLocaleDateString()} · {item.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
