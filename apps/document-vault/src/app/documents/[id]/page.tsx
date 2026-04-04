export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-white">Document</h1>
      <p className="mt-2 text-[#8B95A5]">Document ID: {id} — detail view coming soon.</p>
    </div>
  );
}
