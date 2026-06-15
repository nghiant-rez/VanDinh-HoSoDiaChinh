import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json({ user: { id: session.userId, username: session.username, role: session.role } });
}
