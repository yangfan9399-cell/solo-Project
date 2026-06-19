import React from 'react'
import { Icon } from './Icon'

export function Modal({
  children, onClose, title, footer, width = 'max-w-3xl'
}: {
  children: React.ReactNode; onClose: () => void; title?: React.ReactNode;
  footer?: React.ReactNode; width?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className={`w-full ${width} bg-white rounded-2xl shadow-2xl border border-paper-200 overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-paper-200">
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
            <button className="btn-ghost !p-2" onClick={onClose}><Icon.X className="w-4 h-4" /></button>
          </div>
        )}
        <div className="p-5">{children}</div>
        {footer !== undefined && (
          <div className="px-5 py-4 border-t border-paper-200 bg-paper-50">{footer}</div>
        )}
      </div>
    </div>
  )
}
