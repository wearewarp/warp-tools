export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { db } from '@/db';
import { loads, checkCalls } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { LoadDetailClient } from './LoadDetailClient';

type Props = { params: Promise<{ id: string }> };

export default async function LoadDetailPage({ params }: Props) {
  const { id } = await params;
  const loadId = parseInt(id, 10);

  if (isNaN(loadId)) notFound();

  const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
  if (!load) notFound();

  const calls = await db
    .select()
    .from(checkCalls)
    .where(eq(checkCalls.load_id, loadId))
    .orderBy(asc(checkCalls.created_at));

  return (
    <div className="p-6 animate-fade-in">
      <LoadDetailClient load={load} checkCalls={calls} />
    </div>
  );
}
