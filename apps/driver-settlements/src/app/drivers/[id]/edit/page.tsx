export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { drivers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { DriverForm } from '../../DriverForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDriverPage({ params }: PageProps) {
  const { id } = await params;
  const [driver] = await db.select().from(drivers).where(eq(drivers.id, parseInt(id, 10)));

  if (!driver) {
    notFound();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Edit Driver</h1>
        <p className="text-sm text-[#8B95A5] mt-1">
          {driver.first_name} {driver.last_name}
        </p>
      </div>
      <DriverForm driver={driver} />
    </div>
  );
}
