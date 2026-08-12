import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden font-sans antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-slate-100 via-slate-50 to-sky-50/40">
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}




