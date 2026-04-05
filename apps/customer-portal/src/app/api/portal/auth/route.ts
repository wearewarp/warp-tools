import { NextRequest, NextResponse } from 'next/server';
import { validatePortalToken, setPortalCookie, updateLastLogin } from '@/lib/portal-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body as { token?: string };

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return NextResponse.json(
        { error: 'Access code is required' },
        { status: 400 }
      );
    }

    const customer = await validatePortalToken(token.trim());

    if (!customer) {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await updateLastLogin(customer.id);

    const response = NextResponse.json({
      success: true,
      customer: { id: customer.id, name: customer.name },
    });

    return setPortalCookie(response, token.trim());
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
