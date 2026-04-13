import { AppHeader } from "./app-header";

export function AppShell({
  children,
  intro,
}: {
  children: React.ReactNode;
  intro?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1e1e1e]">
      <AppHeader />
      {intro ? (
        <div className="mx-auto max-w-[1400px] border-b border-[#e6e6e6] px-6 py-6 md:px-8">
          {intro}
        </div>
      ) : null}
      <main className="mx-auto max-w-[1400px] px-6 py-8 md:px-8">{children}</main>
    </div>
  );
}
