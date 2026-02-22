'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FileCode, Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Template {
  id: string;
  name: string;
  type: string;
  specialty: string | null;
  body: string;
  requiredSections: string | null;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/templates')
      .then((res) => (res.ok ? res.json() : []))
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setTemplates((t) => t.filter((x) => x.id !== id));
      toast.success('Template deleted');
    } else {
      toast.error('Failed to delete template');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
        <p className="text-gray-600 mt-2">
          Custom document templates with variables like {`{{patientName}}`}, {`{{consultationDate}}`}
        </p>
      </div>

      {loading ? (
        <Card>
          <div className="text-center py-8 text-gray-500">Loading templates...</div>
        </Card>
      ) : templates.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <FileCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No custom templates yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Use built-in specialties (Cardiology, Surgery, etc.) when generating documents, or create custom templates here for reuse.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((t) => (
            <Card key={t.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{t.name}</h3>
                  <p className="text-sm text-gray-500">
                    {t.type.replace('_', ' ')} {t.specialty ? ` · ${t.specialty}` : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{t.body.slice(0, 120)}...</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast('Edit template: open template editor (ID: ' + t.id + ')')}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {t.id.length >= 20 && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(t.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
