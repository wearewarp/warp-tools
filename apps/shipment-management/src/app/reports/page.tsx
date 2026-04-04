import { ReportsClient } from './ReportsClient';

export const dynamic = 'force-dynamic';

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-[#8B95A5] text-sm mt-1">Volume, revenue, performance, and compliance analytics</p>
      </div>
      <ReportsClient />
    </div>
  );
}
