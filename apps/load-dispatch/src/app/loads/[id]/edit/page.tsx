export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { loads } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { LoadForm } from '../../LoadForm';

type Params = { params: Promise<{ id: string }> };

export default async function EditLoadPage({ params }: Params) {
  const { id } = await params;
  const loadId = parseInt(id, 10);

  if (isNaN(loadId)) notFound();

  const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
  if (!load) notFound();

  return (
    <div className="p-6 animate-fade-in max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Edit Load</h1>
        <p className="text-sm text-[#8B95A5] mt-1">
          <span className="font-mono text-[#00C650]">{load.load_number}</span>
        </p>
      </div>
      <LoadForm load={load} />
    </div>
  );
}
