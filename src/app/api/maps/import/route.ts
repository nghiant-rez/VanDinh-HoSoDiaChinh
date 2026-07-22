import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  const session = await requireAuth();

  const { searchParams } = new URL(request.url);
  const limitFiles = searchParams.get('limit_files') || '0';
  const confirmation = request.headers.get('X-Confirm-Replace') ?? '';

  try {
    const resp = await fetch(`${BACKEND_URL}/api/gis/import?limit_files=${limitFiles}`, {
      method: 'POST',
      headers: {
        'X-User-Id': session.userId.toString(),
        'X-Confirm-Replace': confirmation,
      },
    });

    if (!resp.ok) {
      const error = await resp.text();
      return NextResponse.json(
        { error: `Backend import failed: ${error}` },
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
