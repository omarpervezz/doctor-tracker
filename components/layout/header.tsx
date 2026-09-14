"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
      <div>
        <h1 className="font-extrabold">Healthcare Operations</h1>
        <p className="text-xs text-slate-500">
          Manage doctors, patients and outcomes
        </p>
      </div>
      <button onClick={logout} className="btn btn-secondary" type="button">
        <LogOut size={17} />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </header>
  );
}
