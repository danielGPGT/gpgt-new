import { PublicHeader } from "./PublicHeader";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-[var(--background)]">
      <PublicHeader />
      <main className="pt-8 text-[var(--foreground)]">
        {children}
      </main>
    </div>
  );
} 