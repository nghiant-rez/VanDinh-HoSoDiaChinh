import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function POST() {
  await requireAuth();
  return NextResponse.json({ message: 'PDF Export API Route Placeholder' });
}
