"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });
    const j = await r.json();
    if (!r.ok) {
      setError(j.error || "Login failed");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }
  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <p className="text-sm font-bold text-blue-600">ADMIN PORTAL</p>
        <h2 className="mt-2 text-3xl font-black">Welcome back</h2>
        <p className="mt-2 text-slate-500">
          Sign in to manage doctors and patients.
        </p>
      </div>
      <form onSubmit={submit} className="card space-y-5 p-6">
        <label className="block text-sm font-bold">
          Email
          <div className="relative mt-2">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="input pl-10!"
              name="email"
              type="email"
              defaultValue="admin@doctortracker.dev"
              required
            />
          </div>
        </label>
        <label className="block text-sm font-bold">
          Password
          <div className="relative mt-2">
            <LockKeyhole
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="input pl-10!"
              name="password"
              type="password"
              defaultValue="Admin123!"
              required
            />
          </div>
        </label>
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <Button className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in securely"}
        </Button>
      </form>
    </div>
  );
}
