'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatDateTime } from '@/lib/utils';
import { FileText, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface Consultation {
  id: string;
  consultationDate: string;
  status: string;
  patient: {
    firstName: string;
    lastName: string;
  };
}

const STATUS_OPTIONS = ['draft', 'in_progress', 'finalized', 'archived'];

export default function ConsultationsPage() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (statusFilter) params.set('status', statusFilter);
    fetchConsultations(params.toString());
  }, [search, statusFilter]);

  const fetchConsultations = async (query?: string) => {
    setIsLoading(true);
    try {
      const url = query ? `/api/consultations?${query}` : '/api/consultations';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setConsultations(data);
      }
    } catch (error) {
      toast.error('Failed to fetch consultations');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consultations</h1>
          <p className="text-gray-600 mt-2">View and manage consultations</p>
        </div>
        <Link href="/dashboard/consultations/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Consultation
          </Button>
        </Link>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search in transcripts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search consultations"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <div className="text-center py-8 text-gray-500">Loading...</div>
        </Card>
      ) : consultations.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No consultations yet</p>
            <Link href="/dashboard/consultations/new">
              <Button>Start Your First Consultation</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {consultations.map((consultation) => (
            <Card key={consultation.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {consultation.patient.firstName} {consultation.patient.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDateTime(consultation.consultationDate)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      consultation.status === 'finalized'
                        ? 'bg-green-100 text-green-800'
                        : consultation.status === 'archived'
                        ? 'bg-gray-100 text-gray-800'
                        : consultation.status === 'draft'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {consultation.status}
                  </span>
                  <Button
                    variant="primary"
                    onClick={() =>
                      router.push(`/dashboard/consultations/${consultation.id}`)
                    }
                  >
                    View
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
