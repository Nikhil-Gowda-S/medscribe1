import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { canManageTemplates } from '@/lib/rbac';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['discharge_summary', 'case_sheet']),
  specialty: z.string().optional(),
  body: z.string(),
  requiredSections: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.documentTemplate.findMany({
      where: {
        OR: [
          { doctorId: session.user.id },
          { doctorId: null },
        ],
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canManageTemplates(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data = createSchema.parse(body);

    const template = await prisma.documentTemplate.create({
      data: {
        doctorId: session.user.id,
        name: data.name,
        type: data.type,
        specialty: data.specialty || null,
        body: data.body,
        requiredSections: data.requiredSections ? JSON.stringify(data.requiredSections) : null,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: 'create_template',
      entityType: 'DocumentTemplate',
      entityId: template.id,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
