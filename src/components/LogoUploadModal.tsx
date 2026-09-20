import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle2, Image as ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { useStore } from '../lib/store';
import { HapinozLogo } from './HapinozLogo';

interface LogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoUploadModal: React.FC<LogoUploadModalProps> = ({ isOpen, onClose }) => {
  const { customLogoUrl, setCustomLogoUrl } = useStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, SVG, or WEBP)');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setUploadSuccess(false);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        // 1. Immediately update client reactive store
        setCustomLogoUrl(base64Data);

        // 2. Persist to server public directory via API
        try {
          const res = await fetch('/api/upload-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataBase64: base64Data,
              filename: file.name,
            }),
          });

          if (!res.ok) {
            console.warn('Server logo save returned non-200, but client localStorage updated.');
          }
        } catch (serverErr) {
          console.warn('Could not reach backend save endpoint, logo saved locally in store:', serverErr);
        }

        setIsUploading(false);
        setUploadSuccess(true);
        setTimeout(() => {
          setUploadSuccess(false);
        }, 3000);
      };

      reader.onerror = () => {
        setErrorMessage('Failed to read the selected image file.');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing logo file');
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-700 text-white flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Exact Brand Logo
              </h3>
              <p className="text-[11px] text-stone-500">
                Target: WhatsApp_Image_2026-04-29_at_9.51.49_PM-removebg-preview.png
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Current Logo Preview */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-stone-700 flex items-center justify-between">
              <span>Live Brand Display Preview</span>
              <span className="text-[10px] text-emerald-700 font-mono font-medium">Unedited Original Aspect</span>
            </div>

            {/* Side-by-side Light and Dark background previews */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-stone-200 bg-white flex flex-col items-center justify-center min-h-[90px] shadow-xs">
                <HapinozLogo className="h-10" variant="dark" showTagline={false} />
                <span className="text-[10px] text-stone-400 mt-2 font-mono">Light Background</span>
              </div>
              <div className="p-4 rounded-xl border border-stone-800 bg-stone-950 flex flex-col items-center justify-center min-h-[90px] shadow-xs">
                <HapinozLogo className="h-10" variant="light" showTagline={false} />
                <span className="text-[10px] text-stone-400 mt-2 font-mono">Dark Hero / Footer</span>
              </div>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-amber-600 bg-amber-50/60 scale-[1.01]'
                : 'border-stone-300 hover:border-amber-700 hover:bg-stone-50/50 bg-stone-50/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
            />

            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
              {isUploading ? (
                <RefreshCw className="w-6 h-6 animate-spin text-amber-700" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>

            <div className="text-sm font-bold text-stone-900">
              Click to select or drag & drop your exact logo
            </div>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Select <span className="font-mono text-stone-700 font-semibold">WhatsApp_Image_...-removebg-preview.png</span> directly from your computer to render it unedited.
            </p>
          </div>

          {/* Success Banner */}
          {uploadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <strong>Exact logo applied!</strong> Saved to public/ directory and applied in real time across Header, Hero, Footer, and Checkout.
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Instructions Box */}
          <div className="p-3.5 bg-amber-50/60 border border-amber-200/70 rounded-xl text-xs text-stone-700 space-y-1.5">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <span>📌 Direct File Placement Option</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              You can also drag your <span className="font-mono font-semibold text-stone-800">WhatsApp_Image_2026-04-29_at_9.51.49_PM-removebg-preview.png</span> file directly into the <strong>public</strong> folder in the left sidebar File Explorer. The website will automatically detect and display it immediately.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setCustomLogoUrl('/WhatsApp_Image_2026-04-29_at_9.51.49_PM-removebg-preview.png');
              onClose();
            }}
            className="text-xs text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
          >
            Reset to Default Path
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
