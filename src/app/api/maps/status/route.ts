import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET() {
  const session = await requireAuth();

  try {
    const resp = await fetch(`${BACKEND_URL}/api/gis/status`, {
      headers: { 'X-User-Id': session.userId.toString() },
    });

    if (!resp.ok) {
      const error = await resp.text();
      return NextResponse.json(
        { error: `Backend status failed: ${error}` },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: `Cannot connect to backend at ${BACKEND_URL}` },
      { status: 502 }
    );
  }
}
