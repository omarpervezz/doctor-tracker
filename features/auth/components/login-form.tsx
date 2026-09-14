"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

type LoginResponse = {
  error?: string;
};

export function LoginForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as LoginResponse;

      if (!response.ok) {
        setError(data.error || "Unable to sign in. Please check your details.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <p className="text-sm font-bold text-blue-600">ADMIN PORTAL</p>

        <h2 className="mt-2 text-3xl font-black">Welcome back</h2>

        <p className="mt-2 text-slate-500">
          Sign in to continue to your dashboard.
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
              placeholder="Enter your email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
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
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in securely"}
        </Button>
      </form>
    </div>
  );
}
