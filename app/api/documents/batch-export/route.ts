import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildPdfBuffer } from '@/lib/generate-pdf';
import JSZip from 'jszip';
import { z } from 'zod';

const bodySchema = z.object({
  documentIds: z.array(z.string()).min(1).max(50),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documentIds } = bodySchema.parse(body);

    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        doctorId: session.user.id,
      },
      include: {
        consultation: {
          include: { patient: true },
        },
        doctor: { select: { name: true } },
      },
    });

    if (documents.length === 0) {
      return NextResponse.json(
        { error: 'No documents found or access denied' },
        { status: 404 }
      );
    }

    const zip = new JSZip();
    const dateStr = new Date().toISOString().split('T')[0];

    for (const doc of documents) {
      const pdfBuffer = buildPdfBuffer(doc);
      const filename = `${doc.type}_${doc.consultation.patient.lastName}_${dateStr}.pdf`;
      zip.file(filename, pdfBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="medscribe-documents-${dateStr}.zip"`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid documentIds (array of 1-50 IDs)' },
        { status: 400 }
      );
    }
    console.error('Error batch exporting:', error);
    return NextResponse.json(
      { error: 'Failed to export documents' },
      { status: 500 }
    );
  }
}
