import { LoginForm } from "@/features/auth/components/login-form";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Stethoscope,
  Users,
} from "lucide-react";

const capabilities = [
  {
    icon: Stethoscope,
    title: "Manage doctors",
    description: "Keep doctor profiles and assignments organized.",
  },
  {
    icon: Users,
    title: "Track patients",
    description: "Review patient records, status, and recent visits.",
  },
  {
    icon: BarChart3,
    title: "Review activity",
    description: "See important operational insights at a glance.",
  },
];

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col xl:px-16 xl:py-12">
        {/* Subtle background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-cyan-500/8 blur-3xl" />
        </div>

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-950/40">
            <Activity size={22} strokeWidth={2.2} />
          </span>

          <div>
            <p className="text-base font-semibold tracking-tight">
              Doctor Tracker
            </p>
            <p className="text-sm text-slate-400">Healthcare administration</p>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 my-auto max-w-xl py-12">
          <p className="mb-4 text-sm font-medium text-blue-400">
            Everything in one place
          </p>

          <h1 className="max-w-lg text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            A simpler way to manage your clinical records.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Sign in to manage doctors, review patient information, and monitor
            day-to-day activity from one secure dashboard.
          </p>

          <div className="mt-10 space-y-6">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/8 text-blue-400">
                  <Icon size={20} />
                </span>

                <div>
                  <p className="font-medium text-white">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-2 border-t border-white/10 pt-6 text-sm text-slate-400">
            <CheckCircle2 size={17} className="text-emerald-400" />
            <span>Secure access for authorized administrators</span>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-slate-500">
          Doctor Tracker Admin Portal
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:min-h-0">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
