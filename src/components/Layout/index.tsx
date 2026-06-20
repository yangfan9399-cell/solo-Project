import React from 'react';
import { cn } from '../../lib/utils';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  className,
  contentClassName,
}) => {
  return (
    <div className={cn('min-h-screen flex flex-col bg-paper-100', className)}>
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main
          className={cn(
            'flex-1 overflow-auto scrollbar-ancient',
            'bg-paper-100',
            contentClassName
          )}
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 10%, rgba(139, 69, 19, 0.02) 0%, transparent 40%),
              radial-gradient(circle at 80% 90%, rgba(139, 69, 19, 0.03) 0%, transparent 40%)
            `,
          }}
        >
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
