import { formatDate } from '@/lib/utils';

export type TemplateContext = {
  patientName: string;
  patientAge: number | null;
  patientGender: string | null;
  medicalRecordNumber?: string;
  consultationDate: Date | string;
  doctorName?: string;
};

const VAR_PATTERN = /\{\{(\w+)\}\}/g;

const VAR_MAP: Record<string, (ctx: TemplateContext) => string> = {
  patientName: (ctx) => ctx.patientName,
  patientAge: (ctx) => String(ctx.patientAge ?? 'N/A'),
  patientGender: (ctx) => ctx.patientGender ?? 'N/A',
  medicalRecordNumber: (ctx) => ctx.medicalRecordNumber ?? 'N/A',
  consultationDate: (ctx) =>
    typeof ctx.consultationDate === 'string'
      ? formatDate(ctx.consultationDate)
      : formatDate(ctx.consultationDate),
  doctorName: (ctx) => ctx.doctorName ?? '',
};

export function substituteTemplateVariables(
  body: string,
  context: TemplateContext
): string {
  return body.replace(VAR_PATTERN, (_, key) => {
    const fn = VAR_MAP[key];
    return fn ? fn(context) : `{{${key}}}`;
  });
}
