import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'doctor',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: message || 'Invalid input' }, { status: 400 });
    }
    // Prisma unique constraint (email already exists)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }
    // Prisma / DB errors
    if (error && typeof error === 'object' && 'message' in error) {
      console.error('Error registering user:', error);
      const msg = (error as { message: string }).message;
      if (msg.includes('connect') || msg.includes('Connection')) {
        return NextResponse.json(
          { error: 'Cannot connect to database. Check DATABASE_URL and that PostgreSQL is running.' },
          { status: 503 }
        );
      }
      if (msg.includes('does not exist') || msg.includes('relation')) {
        return NextResponse.json(
          { error: 'Database not set up. Run: npm run db:push' },
          { status: 503 }
        );
      }
    }
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
