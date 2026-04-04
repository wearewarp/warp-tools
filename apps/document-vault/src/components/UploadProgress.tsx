import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Props {
  filename: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'done' | 'error';
  errorMessage?: string;
}

export function UploadProgress({ filename, progress, status, errorMessage }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {status === 'uploading' && (
          <Loader2 className="h-4 w-4 text-[#00C650] animate-spin flex-shrink-0" />
        )}
        {status === 'done' && (
          <CheckCircle className="h-4 w-4 text-[#00C650] flex-shrink-0" />
        )}
        {status === 'error' && (
          <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
        )}
        {status === 'pending' && (
          <div className="h-4 w-4 rounded-full border-2 border-[#2A3245] flex-shrink-0" />
        )}
        <span className="text-sm text-white truncate flex-1">{filename}</span>
        <span className="text-xs text-[#8B95A5] flex-shrink-0">
          {status === 'done' ? 'Done' : status === 'error' ? 'Failed' : `${progress}%`}
        </span>
      </div>

      {(status === 'uploading' || status === 'pending') && (
        <div className="h-1.5 rounded-full bg-[#1A2235] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#00C650] transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {status === 'error' && errorMessage && (
        <p className="text-xs text-red-400 pl-6">{errorMessage}</p>
      )}
    </div>
  );
}
