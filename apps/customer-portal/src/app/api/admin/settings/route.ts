import { NextResponse } from 'next/server';
import { db } from '@/db';
import { portalSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const rows = await db.select().from(portalSettings).where(eq(portalSettings.id, 'default'));
    if (rows.length > 0) {
      return NextResponse.json(rows[0]);
    }
    // Return defaults
    return NextResponse.json({
      id: 'default',
      companyName: 'My Brokerage',
      supportEmail: null,
      supportPhone: null,
      welcomeMessage: null,
      footerText: null,
      updatedAt: null,
    });
  } catch (error) {
    console.error('Failed to load settings:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { companyName, supportEmail, supportPhone, welcomeMessage, footerText } = body;

    const existing = await db.select().from(portalSettings).where(eq(portalSettings.id, 'default'));

    if (existing.length > 0) {
      await db
        .update(portalSettings)
        .set({
          companyName: companyName ?? existing[0].companyName,
          supportEmail: supportEmail ?? existing[0].supportEmail,
          supportPhone: supportPhone ?? existing[0].supportPhone,
          welcomeMessage: welcomeMessage ?? existing[0].welcomeMessage,
          footerText: footerText ?? existing[0].footerText,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(portalSettings.id, 'default'));
    } else {
      await db.insert(portalSettings).values({
        id: 'default',
        companyName: companyName ?? 'My Brokerage',
        supportEmail: supportEmail ?? null,
        supportPhone: supportPhone ?? null,
        welcomeMessage: welcomeMessage ?? null,
        footerText: footerText ?? null,
        updatedAt: new Date().toISOString(),
      });
    }

    const updated = await db.select().from(portalSettings).where(eq(portalSettings.id, 'default'));
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
