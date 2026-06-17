'use client';

import { useRef, useEffect } from 'react';
import SignaturePad from 'signature_pad';
import { X, Check, RotateCcw } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (dataUrl: string) => void;
  width?: number;
  height?: number;
}

export default function SignaturePadModal({ open, onClose, onConfirm, width = 500, height = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(ratio, ratio);
      padRef.current = new SignaturePad(canvas, {
        penColor: '#1e293b',
        minWidth: 1.5,
        maxWidth: 4,
        backgroundColor: '#ffffff',
      });
    }
    return () => {
      if (padRef.current) {
        padRef.current.off();
      }
    };
  }, [open, width, height]);

  if (!open) return null;

  const handleClear = () => padRef.current?.clear();

  const handleConfirm = () => {
    if (padRef.current && !padRef.current.isEmpty()) {
      const dataUrl = padRef.current.toDataURL('image/svg+xml');
      onConfirm(dataUrl);
      padRef.current.clear();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[560px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">电子签名</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-3">请在下方区域用鼠标或触控板签名：</p>
          <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden">
            <canvas ref={canvasRef} className="block cursor-crosshair" />
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition"
          >
            <RotateCcw size={16} /> 清除重签
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-medium"
            >
              <Check size={16} /> 确认签名
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
