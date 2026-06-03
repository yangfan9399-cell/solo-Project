import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
