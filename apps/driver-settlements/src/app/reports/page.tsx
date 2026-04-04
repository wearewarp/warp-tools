export const dynamic = 'force-dynamic';

import { BarChart2 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-sm text-[#8B95A5] mt-1">Driver pay analytics and settlement summaries</p>
      </div>

      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-14 w-14 rounded-2xl bg-[#00C650]/10 border border-[#00C650]/20 flex items-center justify-center">
          <BarChart2 className="h-7 w-7 text-[#00C650]" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">Reports Coming Soon</h2>
          <p className="text-sm text-[#8B95A5] mt-1 max-w-sm">
            Pay period summaries, driver earnings breakdowns, and deduction reports will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
