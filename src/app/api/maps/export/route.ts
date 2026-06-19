import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  await requireAuth();

  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();

  for (const [key, value] of searchParams.entries()) {
    params.set(key, value);
  }

  try {
    const resp = await fetch(
      `${BACKEND_URL}/api/gis/export?${params.toString()}`
    );

    if (!resp.ok) {
      return NextResponse.json(
        { error: 'Export failed' },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    return NextResponse.json(data, {
      headers: {
        'Content-Disposition': 'attachment; filename="vandinh_parcels.geojson"',
      },
    });
  } catch {
    return NextResponse.json(
      { error: `Cannot connect to backend at ${BACKEND_URL}` },
      { status: 502 }
    );
  }
}
