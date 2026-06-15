import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  await requireAuth();
  return NextResponse.json({ message: 'Users API Route Placeholder' });
}
