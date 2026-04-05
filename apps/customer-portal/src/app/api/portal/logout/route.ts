import { NextResponse } from 'next/server';
import { clearPortalCookie } from '@/lib/portal-auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  return clearPortalCookie(response);
}
