export const dynamic = 'force-dynamic';

import { LoadForm } from '../LoadForm';

export default function NewLoadPage() {
  return (
    <div className="p-6 animate-fade-in max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">New Load</h1>
        <p className="text-sm text-[#8B95A5] mt-1">Create a new freight shipment</p>
      </div>
      <LoadForm />
    </div>
  );
}
