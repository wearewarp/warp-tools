'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileUp } from 'lucide-react';
import { useToast } from './Toast';

interface UploadDropZoneProps {
  onFiles?: (files: File[]) => void;
}

export function UploadDropZone({ onFiles }: UploadDropZoneProps = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (onFiles && fileList && fileList.length > 0) {
        onFiles(Array.from(fileList));
        return;
      }
      toast({ message: 'Upload coming soon — document storage in progress!', type: 'info' });
      router.push('/documents');
    },
    [toast, router, onFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files ?? null);
    },
    [handleFiles]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative cursor-pointer rounded-2xl border-2 border-dashed transition-all select-none"
      style={{
        borderColor: isDragging ? '#00C650' : '#1A2235',
        backgroundColor: isDragging ? '#0A1A12' : '#0C1528',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.tiff,.webp"
        className="sr-only"
        onChange={handleInputChange}
      />
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4 transition-all"
          style={{
            backgroundColor: isDragging ? '#00C65020' : '#1A2235',
          }}
        >
          {isDragging ? (
            <FileUp className="h-7 w-7 text-[#00C650]" />
          ) : (
            <Upload className="h-7 w-7 text-[#4B6080]" />
          )}
        </div>
        <p
          className="text-base font-semibold transition-colors"
          style={{ color: isDragging ? '#00C650' : '#CBD5E1' }}
        >
          {isDragging ? 'Drop to upload' : 'Drop files here or click to upload'}
        </p>
        <p className="mt-1.5 text-sm text-[#4B6080]">
          PDF, PNG, JPG, TIFF, WEBP — up to 25 MB per file
        </p>
      </div>
    </div>
  );
}
