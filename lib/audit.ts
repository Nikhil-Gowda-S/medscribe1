import { prisma } from '@/lib/prisma';

export type AuditAction =
  | 'create_patient'
  | 'update_patient'
  | 'delete_patient'
  | 'create_consultation'
  | 'update_consultation'
  | 'clone_consultation'
  | 'generate_document'
  | 'update_document'
  | 'finalize_document'
  | 'create_template'
  | 'update_template'
  | 'delete_template';

export async function logAudit(params: {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress,
      },
    });
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}

export const CONSULTATION_STATUSES = ['draft', 'in_progress', 'finalized', 'archived'] as const;
export type ConsultationStatus = (typeof CONSULTATION_STATUSES)[number];

export const USER_ROLES = ['doctor', 'nurse', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];
