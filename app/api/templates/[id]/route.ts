import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { canManageTemplates } from '@/lib/rbac';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['discharge_summary', 'case_sheet']).optional(),
  specialty: z.string().optional().nullable(),
  body: z.string().optional(),
  requiredSections: z.array(z.string()).optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await prisma.documentTemplate.findFirst({
      where: {
        id: params.id,
        OR: [
          { doctorId: session.user.id },
          { doctorId: null },
        ],
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canManageTemplates(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.documentTemplate.findFirst({
      where: {
        id: params.id,
        doctorId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const body = await request.json();
    const data = updateSchema.parse(body);

    const template = await prisma.documentTemplate.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.specialty !== undefined && { specialty: data.specialty }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.requiredSections !== undefined && {
          requiredSections: data.requiredSections === null ? null : JSON.stringify(data.requiredSections),
        }),
      },
    });

    await logAudit({
      userId: session.user.id,
      action: 'update_template',
      entityType: 'DocumentTemplate',
      entityId: template.id,
    });

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canManageTemplates(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.documentTemplate.findFirst({
      where: {
        id: params.id,
        doctorId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await prisma.documentTemplate.delete({
      where: { id: params.id },
    });

    await logAudit({
      userId: session.user.id,
      action: 'delete_template',
      entityType: 'DocumentTemplate',
      entityId: params.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
