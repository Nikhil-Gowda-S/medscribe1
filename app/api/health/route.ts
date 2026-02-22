import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};
  let healthy = true;

  // Database
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latencyMs: Date.now() - start };
  } catch (e) {
    healthy = false;
    checks.database = {
      status: 'error',
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }

  // Optional: AI availability (don't fail health if keys missing)
  checks.ai = {
    status: process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY ? 'configured' : 'not_configured',
  };

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
