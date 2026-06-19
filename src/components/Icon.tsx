import React from 'react'

type P = React.SVGProps<SVGSVGElement>
const base: P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24' }

export const Icon = {
  Plus: (p: P) => <svg {...base} {...p}><path d='M12 5v14M5 12h14'/></svg>,
  Upload: (p: P) => <svg {...base} {...p}><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='17 8 12 3 7 8'/><line x1='12' y1='3' x2='12' y2='15'/></svg>,
  Paste: (p: P) => <svg {...base} {...p}><path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'/><rect x='8' y='2' width='8' height='4' rx='1'/></svg>,
  Search: (p: P) => <svg {...base} {...p}><circle cx='11' cy='11' r='7'/><path d='m21 21-4.3-4.3'/></svg>,
  Filter: (p: P) => <svg {...base} {...p}><path d='M3 5h18M6 12h12M10 19h4'/></svg>,
  Eye: (p: P) => <svg {...base} {...p}><path d='M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z'/><circle cx='12' cy='12' r='3'/></svg>,
  Check: (p: P) => <svg {...base} {...p}><polyline points='20 6 9 17 4 12'/></svg>,
  X: (p: P) => <svg {...base} {...p}><path d='M18 6 6 18M6 6l12 12'/></svg>,
  Alert: (p: P) => <svg {...base} {...p}><path d='M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/></svg>,
  Warn: (p: P) => <svg {...base} {...p}><path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z'/></svg>,
  Info: (p: P) => <svg {...base} {...p}><circle cx='12' cy='12' r='10'/><path d='M12 16v-4M12 8h.01'/></svg>,
  ChevronLeft: (p: P) => <svg {...base} {...p}><polyline points='15 18 9 12 15 6'/></svg>,
  ChevronRight: (p: P) => <svg {...base} {...p}><polyline points='9 18 15 12 9 6'/></svg>,
  ChevronDown: (p: P) => <svg {...base} {...p}><polyline points='6 9 12 15 18 9'/></svg>,
  Download: (p: P) => <svg {...base} {...p}><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/></svg>,
  Refresh: (p: P) => <svg {...base} {...p}><polyline points='23 4 23 10 17 10'/><path d='M20.49 15a9 9 0 1 1-2.12-9.36L23 10'/></svg>,
  Lock: (p: P) => <svg {...base} {...p}><rect x='3' y='11' width='18' height='11' rx='2'/><path d='M7 11V7a5 5 0 0 1 10 0v4'/></svg>,
  Unlock: (p: P) => <svg {...base} {...p}><rect x='3' y='11' width='18' height='11' rx='2'/><path d='M7 11V7a5 5 0 0 1 9.9-1'/></svg>,
  Repeat: (p: P) => <svg {...base} {...p}><path d='m17 2 4 4-4 4'/><path d='M3 11v-1a4 4 0 0 1 4-4h14'/><path d='m7 22-4-4 4-4'/><path d='M21 13v1a4 4 0 0 1-4 4H3'/></svg>,
  Camera: (p: P) => <svg {...base} {...p}><path d='M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z'/><circle cx='12' cy='13' r='3'/></svg>,
  Scale: (p: P) => <svg {...base} {...p}><path d='m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z'/><path d='m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z'/><path d='M7 21h10'/><path d='M12 3v18'/><path d='M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2'/></svg>,
  User: (p: P) => <svg {...base} {...p}><path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/><circle cx='12' cy='7' r='4'/></svg>,
  Clock: (p: P) => <svg {...base} {...p}><circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/></svg>,
  ArrowLeftRight: (p: P) => <svg {...base} {...p}><path d='M8 3 4 7l4 4'/><path d='M4 7h16'/><path d='m16 21 4-4-4-4'/><path d='M20 17H4'/></svg>,
  FileText: (p: P) => <svg {...base} {...p}><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z'/><polyline points='14 2 14 8 20 8'/><line x1='16' y1='13' x2='8' y2='13'/><line x1='16' y1='17' x2='8' y2='17'/><polyline points='10 9 9 9 8 9'/></svg>,
  Layers: (p: P) => <svg {...base} {...p}><path d='m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z'/><path d='m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65'/><path d='m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65'/></svg>,
  MicrScope: (p: P) => <svg {...base} {...p}><path d='M6 18h8'/><path d='M3 22h18'/><path d='M14 22a7 7 0 1 0 0-14h-1'/><path d='M9 14h2'/><path d='M13 12V9.5'/><path d='M14 3a2 2 0 0 0-4 0v5a2 2 0 0 0 4 0Z'/></svg>,
  Gauge: (p: P) => <svg {...base} {...p}><path d='m12 14 4-4'/><path d='M3.34 19a10 10 0 1 1 17.32 0'/></svg>,
  Split: (p: P) => <svg {...base} {...p}><path d='M16 3h5v5'/><path d='M8 21H3v-5'/><path d='M22 3 14 11'/><path d='m3 21 8-8'/><path d='M21 3h-7'/><path d='M10 13H3'/></svg>,
  Table: (p: P) => <svg {...base} {...p}><path d='M12 3v18'/><rect width='18' height='18' x='3' y='3' rx='2'/><path d='M3 9h18'/><path d='M3 15h18'/></svg>,
  Send: (p: P) => <svg {...base} {...p}><path d='M22 2 11 13'/><path d='m22 2-7 20-4-9-9-4Z'/></svg>,
  Edit3: (p: P) => <svg {...base} {...p}><path d='M12 20h9'/><path d='M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z'/></svg>,
}
