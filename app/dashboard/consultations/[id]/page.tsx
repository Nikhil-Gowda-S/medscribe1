'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { formatDateTime, calculateAge } from '@/lib/utils';
import { FileText, Download, Save, Copy, RefreshCw, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface Consultation {
  id: string;
  transcript: string | null;
  status: string;
  consultationDate: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string | null;
    gender: string | null;
    medicalRecordNumber: string | null;
  };
  documents: Array<{
    id: string;
    type: string;
    template: string | null;
    content: string;
    createdAt: string;
  }>;
}

export default function ConsultationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const consultationId = params.id as string;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentType, setDocumentType] = useState<'discharge_summary' | 'case_sheet'>('discharge_summary');
  const [template, setTemplate] = useState('');
  const [includeIcd10, setIncludeIcd10] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    fetchConsultation();
  }, [consultationId]);

  const fetchConsultation = async () => {
    try {
      const response = await fetch(`/api/consultations/${consultationId}`);
      if (response.ok) {
        const data = await response.json();
        setConsultation(data);
        setTranscript(data.transcript || '');
      } else {
        toast.error('Failed to fetch consultation');
        router.push('/dashboard/consultations');
      }
    } catch (error) {
      toast.error('Failed to fetch consultation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTranscript = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/consultations/${consultationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) throw new Error('Failed to save transcript');

      toast.success('Transcript saved successfully');
      await fetchConsultation();
    } catch (error) {
      toast.error('Failed to save transcript');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/consultations/${consultationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setConsultation((c) => (c ? { ...c, status: newStatus } : null));
        toast.success('Status updated');
      } else toast.error('Failed to update status');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleCloneConsultation = async () => {
    setCloning(true);
    try {
      const res = await fetch(`/api/consultations/${consultationId}/clone`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast.success('Consultation cloned');
        router.push(`/dashboard/consultations/${data.id}`);
      } else toast.error('Failed to clone');
    } catch {
      toast.error('Failed to clone');
    } finally {
      setCloning(false);
    }
  };

  const handleRegenerateDocument = async (documentId: string) => {
    setRegeneratingId(documentId);
    try {
      const res = await fetch(`/api/documents/${documentId}/regenerate`, { method: 'POST' });
      if (res.ok) {
        await fetchConsultation();
        toast.success('Document regenerated');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to regenerate');
      }
    } catch {
      toast.error('Failed to regenerate');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleGenerateDocument = async () => {
    if (!transcript.trim()) {
      toast.error('Please add a transcript first');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId,
          type: documentType,
          template: template || undefined,
          includeIcd10,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate document');
      }

      const document = await response.json();
      toast.success('Document generated successfully!');
      await fetchConsultation();
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDoc = async (documentId: string, format: 'pdf' | 'word' | 'html') => {
    try {
      const path = format === 'pdf' ? 'pdf' : format === 'word' ? 'word' : 'html';
      const response = await fetch(`/api/documents/${documentId}/${path}`);
      if (!response.ok) throw new Error(`Failed to generate ${format}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document_${documentId}.${format === 'pdf' ? 'pdf' : format === 'word' ? 'docx' : 'html'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch {
      toast.error(`Failed to download ${format}`);
    }
  };

  const handleDownloadPDF = (documentId: string) => downloadDoc(documentId, 'pdf');

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading consultation...</div>
      </div>
    );
  }

  if (!consultation) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consultation</h1>
          <p className="text-gray-600 mt-2">
            {consultation.patient.firstName} {consultation.patient.lastName}
            {consultation.patient.dateOfBirth &&
              calculateAge(consultation.patient.dateOfBirth) !== null && (
                <span className="ml-2">
                  ({calculateAge(consultation.patient.dateOfBirth)}
                  {consultation.patient.gender
                    ? `/${consultation.patient.gender.charAt(0)}`
                    : ''}
                  )
                </span>
              )}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {formatDateTime(consultation.consultationDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Status:</span>
          <select
            value={consultation.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
            aria-label="Consultation status"
          >
            <option value="draft">Draft</option>
            <option value="in_progress">In progress</option>
            <option value="finalized">Finalized</option>
            <option value="archived">Archived</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleCloneConsultation} disabled={cloning} className="flex items-center gap-1">
            <Copy className="w-4 h-4" />
            Clone
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Patient Information">
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Name:</span>{' '}
              {consultation.patient.firstName} {consultation.patient.lastName}
            </div>
            {consultation.patient.dateOfBirth && (
              <div>
                <span className="font-medium">Date of Birth:</span>{' '}
                {new Date(consultation.patient.dateOfBirth).toLocaleDateString()}
              </div>
            )}
            {consultation.patient.gender && (
              <div>
                <span className="font-medium">Gender:</span>{' '}
                {consultation.patient.gender}
              </div>
            )}
            {consultation.patient.medicalRecordNumber && (
              <div>
                <span className="font-medium">Medical Record #:</span>{' '}
                {consultation.patient.medicalRecordNumber}
              </div>
            )}
          </div>
        </Card>

        <Card title="Generate Document">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) =>
                  setDocumentType(e.target.value as 'discharge_summary' | 'case_sheet')
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="discharge_summary">Discharge Summary</option>
                <option value="case_sheet">Case Sheet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template (Optional)
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">General</option>
                <option value="cardiology">Cardiology</option>
                <option value="surgery">Surgery</option>
                <option value="pediatrics">Pediatrics</option>
                <option value="orthopedics">Orthopedics</option>
                <option value="neurology">Neurology</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeIcd10}
                onChange={(e) => setIncludeIcd10(e.target.checked)}
              />
              Include ICD-10 code suggestions
            </label>

            <Button
              onClick={handleGenerateDocument}
              isLoading={isGenerating}
              disabled={!transcript.trim()}
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate {documentType === 'discharge_summary' ? 'Discharge Summary' : 'Case Sheet'}
            </Button>
          </div>
        </Card>
      </div>

      <Card title="Transcript">
        <div className="space-y-4">
          <VoiceRecorder
            onTranscriptUpdate={setTranscript}
            initialTranscript={transcript}
          />
          <div className="flex gap-4">
            <Button
              onClick={handleSaveTranscript}
              isLoading={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Transcript
            </Button>
          </div>
        </div>
      </Card>

      {consultation.documents.length > 0 && (
        <Card title="Generated Documents">
          <div className="space-y-4">
            {consultation.documents.map((doc) => (
              <div
                key={doc.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-semibold capitalize">
                      {doc.type.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(doc.createdAt)}
                      {doc.template && ` • ${doc.template}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerateDocument(doc.id)}
                      disabled={regeneratingId === doc.id}
                      className="flex items-center gap-1"
                      title="Regenerate with AI from current text"
                    >
                      <RefreshCw className={`w-4 h-4 ${regeneratingId === doc.id ? 'animate-spin' : ''}`} />
                      Regenerate
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(doc.id)} className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadDoc(doc.id, 'word')} className="flex items-center gap-1">
                      <FileDown className="w-4 h-4" />
                      Word
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadDoc(doc.id, 'html')} className="flex items-center gap-1">
                      HTML
                    </Button>
                  </div>
                </div>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border">
                    {doc.content}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
