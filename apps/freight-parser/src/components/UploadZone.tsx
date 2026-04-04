'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { SampleSelector } from './SampleSelector';

interface UploadZoneProps {
  onFile: (file: File) => void;
  onText: (text: string) => void;
  loading: boolean;
}

export function UploadZone({ onFile, onText, loading }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [text, setText] = useState('');
  const [tab, setTab] = useState<'upload' | 'paste'>('upload');
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const validateAndSubmitFile = useCallback(
    (file: File) => {
      setFileError(null);
      const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowed.includes(file.type)) {
        setFileError('Only PDF, PNG, and JPG files are supported.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFileError('File exceeds the 10MB limit.');
        return;
      }
      onFile(file);
    },
    [onFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSubmitFile(file);
    },
    [validateAndSubmitFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSubmitFile(file);
    },
    [validateAndSubmitFile]
  );

  function handleTextSubmit() {
    if (text.trim()) {
      onText(text.trim());
    }
  }

  function handleSampleSelect(sampleText: string) {
    setText(sampleText);
    setTab('paste');
    onText(sampleText);
  }

  const dropZoneClass = `
    relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
    ${dragging ? 'border-[#00C650] bg-[#00C650]/5' : 'border-[#1A2235] hover:border-[#2A3345]'}
    ${loading ? 'opacity-50 pointer-events-none' : ''}
  `.trim();

  return (
    <div className="space-y-4">
      {/* Sample selector */}
      <SampleSelector onSelect={handleSampleSelect} />

      {/* Tab toggle */}
      <div className="flex gap-1 bg-[#080F1E] border border-[#1A2235] rounded-xl p-1">
        <button
          onClick={() => setTab('upload')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            tab === 'upload'
              ? 'bg-[#1A2235] text-slate-200'
              : 'text-[#8B95A5] hover:text-slate-300'
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => setTab('paste')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            tab === 'paste'
              ? 'bg-[#1A2235] text-slate-200'
              : 'text-[#8B95A5] hover:text-slate-300'
          }`}
        >
          Paste Text
        </button>
      </div>

      {/* Upload tab */}
      {tab === 'upload' && (
        <div>
          <div
            className={dropZoneClass}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileInput}
            />
            <div className="flex flex-col items-center gap-3 pointer-events-none">
              <div className="w-12 h-12 rounded-xl bg-[#00C650]/10 flex items-center justify-center">
                <Upload size={22} className="text-[#00C650]" />
              </div>
              <div>
                <p className="text-slate-200 font-medium">Drop your freight document here</p>
                <p className="text-sm text-[#8B95A5] mt-1">or click to browse</p>
              </div>
              <p className="text-xs text-[#8B95A5]">PDF, PNG, JPG · Max 10MB</p>
            </div>
          </div>

          {fileError && (
            <div className="mt-2 flex items-center gap-2 text-sm text-[#FF4444]">
              <AlertCircle size={14} />
              <span>{fileError}</span>
            </div>
          )}
        </div>
      )}

      {/* Paste tab */}
      {tab === 'paste' && (
        <div className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste freight document text here — rate confirmation, BOL, invoice…"
            rows={10}
            className="w-full bg-[#080F1E] border border-[#1A2235] rounded-xl px-4 py-3 text-sm text-slate-200 font-mono placeholder-[#8B95A5]/60 focus:outline-none focus:ring-1 focus:ring-[#00C650] resize-none transition-colors hover:border-[#2A3345]"
          />
          <button
            onClick={handleTextSubmit}
            disabled={!text.trim() || loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#00C650] text-[#040810] font-semibold text-sm hover:bg-[#00B048] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <FileText size={15} />
            {loading ? 'Parsing…' : 'Parse Document'}
          </button>
        </div>
      )}
    </div>
  );
}
