import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Toaster } from 'sonner';

export function RootLayout() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar className="hidden md:block" />
        <main className="flex-1 overflow-y-auto bg-[var(--background)]">
          <Outlet />
        </main>
      </div>
      <Toaster richColors closeButton position="top-right" />
    </div>
  );
} 