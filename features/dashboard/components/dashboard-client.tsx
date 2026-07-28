"use client";
import { useEffect, useState } from "react";
import { Activity, Stethoscope, Users, UserRoundCheck } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
type Data = {
  totals: {
    doctors: number;
    patients: number;
    averagePatientsPerDoctor: number;
  };
  statusBreakdown: { name: string; value: number }[];
  patientsPerDoctor: { name: string; patients: number }[];
  monthlyPatients: { month: string; patients: number }[];
  recentPatients: {
    id: string;
    name: string;
    condition: string;
    status: string;
    doctorName: string;
    createdAt: string;
  }[];
};
export function DashboardClient() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard", {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load dashboard");
        }
        setData(payload.data);
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") {
          setError(
            (requestError as Error).message || "Unable to load dashboard",
          );
        }
      }
    }

    loadDashboard();
    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <div className="card p-6">
        <h2 className="font-bold text-red-700">Dashboard unavailable</h2>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  if (!data)
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((x) => (
          <div key={x} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
    );
  const cards = [
    { label: "Total doctors", value: data.totals.doctors, icon: Stethoscope },
    { label: "Total patients", value: data.totals.patients, icon: Users },
    {
      label: "Avg. patients / doctor",
      value: data.totals.averagePatientsPerDoctor,
      icon: UserRoundCheck,
    },
  ];
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-blue-600">OVERVIEW</p>
        <h2 className="text-3xl font-black">Dashboard</h2>
        <p className="text-slate-500">
          A concise view of your care network and patient activity.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div
            className="card flex items-center justify-between p-5"
            key={label}
          >
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-black">{value}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
              <Icon />
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="card p-5 xl:col-span-3">
          <h3 className="font-bold">Patients per doctor</h3>
          <p className="text-sm text-slate-500">
            Top six doctors by assigned patients
          </p>
          <div className="mt-5 h-80">
            <ResponsiveContainer>
              <BarChart data={data.patientsPerDoctor}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="patients" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5 xl:col-span-2">
          <h3 className="font-bold">Patient status</h3>
          <p className="text-sm text-slate-500">Current distribution</p>
          <div className="mt-5 h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.statusBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={90}
                  paddingAngle={4}
                >
                  {data.statusBreakdown.map((_, i) => (
                    <Cell
                      key={i}
                      fill={["#2563eb", "#16a34a", "#f59e0b", "#dc2626"][i % 4]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {data.statusBreakdown.map((x, i) => (
              <div className="text-sm" key={x.name}>
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-full"
                  style={{
                    background: ["#2563eb", "#16a34a", "#f59e0b", "#dc2626"][
                      i % 4
                    ],
                  }}
                />
                {x.name}: <b>{x.value}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="card p-5 xl:col-span-3">
          <h3 className="font-bold">New patients over time</h3>
          <div className="mt-5 h-64">
            <ResponsiveContainer>
              <BarChart data={data.monthlyPatients}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="patients" fill="#0f766e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5 xl:col-span-2">
          <h3 className="font-bold">Recent patients</h3>
          <div className="mt-4 space-y-3">
            {data.recentPatients.map((p) => (
              <div
                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                key={p.id}
              >
                <div className="rounded-full bg-blue-100 p-2 text-blue-700">
                  <Activity size={17} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{p.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {p.condition} · {p.doctorName}
                  </p>
                </div>
                <span className="ml-auto text-xs capitalize text-slate-500">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
