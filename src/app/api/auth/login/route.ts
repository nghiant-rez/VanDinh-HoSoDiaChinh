import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập tài khoản và mật khẩu' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });

    if (!user || !user.is_active) {
      return NextResponse.json({ error: 'Tài khoản không tồn tại hoặc bị khóa' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json({ error: 'Mật khẩu không chính xác' }, { status: 401 });
    }

    const session = await getSession();
    session.userId = user.id;
    session.username = user.username;
    session.role = user.role.name as 'ADMIN' | 'STAFF';
    session.isLoggedIn = true;
    await session.save();

    // Log login
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'LOGIN',
        details: 'Đăng nhập thành công',
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Đã có lỗi xảy ra' }, { status: 500 });
  }
}
