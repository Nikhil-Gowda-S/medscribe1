import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        doctorId: session.user.id,
      },
      include: {
        consultation: { include: { patient: true } },
        doctor: { select: { name: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const patient = document.consultation.patient;
    const patientName = `${patient.firstName} ${patient.lastName}`;
    const paragraphs: Paragraph[] = [
      new Paragraph({
        text: document.type === 'discharge_summary' ? 'DISCHARGE SUMMARY' : 'CASE SHEET',
        heading: 'Title',
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Patient: ', bold: true }),
          new TextRun(patientName),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'DOB: ', bold: true }),
          new TextRun(patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'N/A'),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Consultation Date: ', bold: true }),
          new TextRun(formatDate(document.consultation.consultationDate)),
        ],
      }),
      new Paragraph({ text: '', spacing: { after: 200 } }),
    ];

    document.content.split(/\n\n+/).forEach((block) => {
      block.split('\n').forEach((line) => {
        if (line.trim()) {
          paragraphs.push(new Paragraph({ text: line.trim(), spacing: { after: 100 } }));
        }
      });
    });

    paragraphs.push(
      new Paragraph({ text: '', spacing: { after: 300 } }),
      new Paragraph({ text: '_________________________' }),
      new Paragraph({ text: document.doctor.name }),
      new Paragraph({ text: 'Authorized Signature', spacing: { after: 100 } })
    );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `${document.type}_${patient.lastName}_${new Date().toISOString().split('T')[0]}.docx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating Word document:', error);
    return NextResponse.json(
      { error: 'Failed to generate Word document' },
      { status: 500 }
    );
  }
}
