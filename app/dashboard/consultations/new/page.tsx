'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

export default function NewConsultationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get('patientId');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    patientIdParam || ''
  );
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      toast.error('Failed to fetch patients');
    }
  };

  const handleSaveConsultation = async () => {
    if (!selectedPatientId) {
      toast.error('Please select a patient');
      return;
    }

    if (!transcript.trim()) {
      toast.error('Please add a transcript');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          transcript: transcript.trim(),
          status: 'completed',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save consultation');
      }

      const consultation = await response.json();
      toast.success('Consultation saved successfully');
      router.push(`/dashboard/consultations/${consultation.id}`);
    } catch (error) {
      toast.error('Failed to save consultation');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Consultation</h1>
        <p className="text-gray-600 mt-2">
          Record your consultation using voice transcription
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Patient *
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a patient...</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName}
                </option>
              ))}
            </select>
            {patients.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No patients found.{' '}
                <button
                  onClick={() => router.push('/dashboard/patients')}
                  className="text-primary-600 hover:underline"
                >
                  Add a patient first
                </button>
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card title="Voice Transcription">
        <VoiceRecorder
          onTranscriptUpdate={setTranscript}
          initialTranscript={transcript}
        />
      </Card>

      <div className="flex gap-4">
        <Button
          onClick={handleSaveConsultation}
          isLoading={isSaving}
          disabled={!selectedPatientId || !transcript.trim()}
        >
          Save Consultation
        </Button>
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
