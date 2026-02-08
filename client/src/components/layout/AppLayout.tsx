/**
 * Main application layout with top bar navigation.
 *
 * Uses a clean top navigation pattern with a gradient mesh
 * background for visual depth.
 */

import { TopBar } from "./TopBar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background relative min-h-screen">
      {/* Gradient mesh background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="from-primary/5 via-background to-primary/3 absolute inset-0 bg-gradient-to-br" />
        <div className="from-primary/8 absolute -top-[40%] left-[20%] h-[80%] w-[60%] rounded-full bg-gradient-to-b to-transparent blur-3xl" />
        <div className="from-primary/5 absolute -bottom-[20%] right-[10%] h-[60%] w-[40%] rounded-full bg-gradient-to-t to-transparent blur-3xl" />
      </div>

      <TopBar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
