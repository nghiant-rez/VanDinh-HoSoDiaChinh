import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  await requireAuth();

  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();

  // Forward all query params to FastAPI
  for (const [key, value] of searchParams.entries()) {
    params.set(key, value);
  }

  try {
    const resp = await fetch(
      `${BACKEND_URL}/api/gis/parcels?${params.toString()}`
    );

    if (!resp.ok) {
      const error = await resp.text();
      return NextResponse.json(
        { error: `Backend parcels failed: ${error}` },
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
