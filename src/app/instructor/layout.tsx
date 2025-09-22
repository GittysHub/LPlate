"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/instructor", label: "Dashboard" },
  { href: "/instructor/availability", label: "Availability" },
  { href: "/instructor/profile", label: "Profile" },
];

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight text-xl">
            L&nbsp;Plate
          </Link>
          <nav className="flex gap-1">
            {tabs.map(t => {
              const active = pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`px-3 py-2 rounded-xl text-sm ${active ? "bg-black text-white" : "hover:bg-neutral-100"}`}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="rounded-2xl border shadow-sm p-6">{children}</div>
      </main>
    </div>
  );
}
