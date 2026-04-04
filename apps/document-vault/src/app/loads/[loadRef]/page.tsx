export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ loadRef: string }>;
}

export default async function LoadDetailPage({ params }: Props) {
  const { loadRef } = await params;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-white">Load {loadRef}</h1>
      <p className="mt-2 text-[#8B95A5]">Load document checklist — detail view coming soon.</p>
    </div>
  );
}
