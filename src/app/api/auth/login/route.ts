import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập tài khoản và mật khẩu' }, { status: 400 });
    }

    // Call the Python FastAPI Backend instead of using Prisma directly
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { error: data.detail || 'Tài khoản không tồn tại hoặc mật khẩu không chính xác' }, 
        { status: response.status === 401 ? 401 : 400 }
      );
    }

    const session = await getSession();
    session.userId = data.user.id;
    session.username = data.user.username;
    session.role = data.user.role as 'ADMIN' | 'STAFF';
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Đã có lỗi xảy ra' }, { status: 500 });
  }
}
