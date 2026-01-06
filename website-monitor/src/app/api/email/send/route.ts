import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { to, subject, html, text } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: '收件人、主题和内容不能为空' }, { status: 400 });
    }

    const success = await sendEmail(to, subject, html, text);

    if (success) {
      return NextResponse.json({ message: '邮件发送成功' });
    } else {
      return NextResponse.json({ error: '邮件发送失败' }, { status: 500 });
    }
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}