import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  user?: {
    displayName: string;
    department: string;
    role: string;
  };
}

export function AppLayout({ title, subtitle, actions, children, user }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} actions={actions} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
