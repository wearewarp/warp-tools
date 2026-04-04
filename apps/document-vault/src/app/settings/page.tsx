export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { documents } from '@/db/schema';
import path from 'path';
import { SettingsClient } from '@/components/SettingsClient';
import { formatFileSize } from '@/lib/utils';
import { Settings } from 'lucide-react';

async function getStorageInfo() {
  const allDocs = await db.select().from(documents);
  const totalFiles = allDocs.length;
  const totalBytes = allDocs.reduce((sum, d) => sum + d.fileSize, 0);
  const uploadsDir = path.join(process.cwd(), 'uploads');
  return { totalFiles, totalBytes, uploadsDir };
}

export default async function SettingsPage() {
  const { totalFiles, totalBytes, uploadsDir } = await getStorageInfo();

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A2235]">
          <Settings className="h-5 w-5 text-[#8B95A5]" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-[#8B95A5]">Configure document requirements and storage</p>
        </div>
      </div>

      {/* Storage Info (server-rendered) */}
      <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5 mb-6">
        <h2 className="text-base font-semibold text-white mb-4">Storage</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-[#8B95A5] uppercase tracking-wide mb-1">Total Files</div>
            <div className="text-2xl font-bold text-white">{totalFiles}</div>
          </div>
          <div>
            <div className="text-xs text-[#8B95A5] uppercase tracking-wide mb-1">Total Size</div>
            <div className="text-2xl font-bold text-white">{formatFileSize(totalBytes)}</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#1A2235]">
          <div className="text-xs text-[#8B95A5] uppercase tracking-wide mb-1">Uploads Directory</div>
          <div className="font-mono text-xs text-[#4B8EE8] bg-[#0C1528] px-3 py-2 rounded-lg break-all">
            {uploadsDir}
          </div>
        </div>
      </div>

      {/* Required docs config — client component with localStorage */}
      <SettingsClient />
    </div>
  );
}
