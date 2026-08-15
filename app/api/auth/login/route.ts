import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const validUser = process.env.AUTH_USERNAME || 'admin';
    const validPass = process.env.AUTH_PASSWORD || 'changeme';

    if (username === validUser && password === validPass) {
      // Tạo auth token đơn giản (trong production nên dùng JWT)
      const authToken = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      
      // Set cookie
      const cookieStore = cookies();
      cookieStore.set('auth_token', authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 ngày
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, message: 'Tên người dùng hoặc mật khẩu không đúng' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi server' },
      { status: 500 }
    );
  }
}
