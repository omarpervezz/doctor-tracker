"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit3, FilterX, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";

type Option = { id: string; name: string; specialization: string };

type Patient = {
  id: string;
  doctorId: string;
  doctorName: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  condition: string;
  status: "active" | "monitoring" | "recovered" | "critical";
  phone: string;
  email: string;
  lastVisit: string;
  createdAt: string;
};

type PatientForm = {
  doctorId: string;
  name: string;
  age: number;
  gender: Patient["gender"];
  condition: string;
  status: Patient["status"];
  phone: string;
  email: string;
  lastVisit: string;
};

const empty: PatientForm = {
  doctorId: "",
  name: "",
  age: 30,
  gender: "female",
  condition: "",
  status: "active",
  phone: "",
  email: "",
  lastVisit: new Date().toISOString().slice(0, 10),
};

function statusClass(status: Patient["status"]) {
  if (status === "critical") return "bg-red-50 text-red-700";
  if (status === "recovered") return "bg-green-50 text-green-700";
  if (status === "monitoring") return "bg-amber-50 text-amber-700";
  return "bg-blue-50 text-blue-700";
}

export function PatientsClient() {
  const [data, setData] = useState<{
    items: Patient[];
    page: number;
    totalPages: number;
    total: number;
  } | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [search, setSearch] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [status, setStatus] = useState("");
  const [condition, setCondition] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState<PatientForm>(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOptions() {
      try {
        const response = await fetch("/api/doctors/options", {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load doctor options");
        }
        setOptions(payload.data || []);
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") {
          setLoadError(
            (requestError as Error).message || "Unable to load doctor options",
          );
        }
      }
    }

    loadOptions();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const query = new URLSearchParams({ page: String(page), limit: "10" });
      if (search.trim()) query.set("search", search.trim());
      if (doctorId) query.set("doctorId", doctorId);
      if (status) query.set("status", status);
      if (condition.trim()) query.set("condition", condition.trim());
      if (from) query.set("from", from);
      if (to) query.set("to", to);

      setLoadError("");
      try {
        const response = await fetch(`/api/patients?${query}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load patients");
        }
        setData(payload.data);
        if (page > payload.data.totalPages) {
          setPage(payload.data.totalPages);
        }
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") {
          setLoadError(
            (requestError as Error).message || "Unable to load patients",
          );
          setData(null);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [condition, doctorId, from, page, refreshKey, search, status, to]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...empty,
      doctorId: doctorId || options[0]?.id || "",
      lastVisit: new Date().toISOString().slice(0, 10),
    });
    setError("");
    setModal(true);
  }

  function openEdit(patient: Patient) {
    setEditing(patient);
    setForm({
      doctorId: patient.doctorId,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      condition: patient.condition,
      status: patient.status,
      phone: patient.phone,
      email: patient.email,
      lastVisit: patient.lastVisit.slice(0, 10),
    });
    setError("");
    setModal(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        editing ? `/api/patients/${editing.id}` : "/api/patients",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Unable to save patient");
        return;
      }
      setModal(false);
      refresh();
    } catch {
      setError("Unable to save patient. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(patient: Patient) {
    if (!window.confirm(`Delete ${patient.name}?`)) return;

    setDeletingId(patient.id);
    setLoadError("");
    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete patient");
      }
      refresh();
    } catch (requestError) {
      setLoadError(
        (requestError as Error).message || "Unable to delete patient",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setDoctorId("");
    setStatus("");
    setCondition("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  const hasFilters = Boolean(
    search || doctorId || status || condition || from || to,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-blue-600">PATIENT DIRECTORY</p>
          <h2 className="text-3xl font-black">Patients</h2>
          <p className="text-slate-500">
            Track assignments, conditions, dates and current status.
          </p>
        </div>
        <Button onClick={openCreate} disabled={!options.length}>
          <Plus size={18} />
          Add patient
        </Button>
      </div>

      <div className="card overflow-hidden">
        <div className="grid gap-3 border-b border-gray-200 p-4 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="input pl-10!"
              placeholder="Search patient, condition or email"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="input"
            value={doctorId}
            onChange={(event) => {
              setDoctorId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All doctors</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="monitoring">Monitoring</option>
            <option value="recovered">Recovered</option>
            <option value="critical">Critical</option>
          </select>
          <input
            className="input"
            placeholder="Condition"
            value={condition}
            onChange={(event) => {
              setCondition(event.target.value);
              setPage(1);
            }}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              aria-label="Patients added from"
              className="input"
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
            />
            <input
              aria-label="Patients added to"
              className="input"
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
            />
          </div>
          {hasFilters && (
            <div className="flex justify-end lg:col-span-6">
              <Button type="button" variant="secondary" onClick={clearFilters}>
                <FilterX size={17} />
                Clear filters
              </Button>
            </div>
          )}
        </div>

        {loadError && (
          <div className="border-b border-red-100 bg-red-50 p-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        <div className="table-wrap">
          {!data ? (
            <div className="skeleton h-96" />
          ) : data.items.length === 0 ? (
            <EmptyState />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th>Last visit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <b>{patient.name}</b>
                      <div className="text-xs text-slate-500">
                        {patient.age} yrs · {patient.gender}
                      </div>
                    </td>
                    <td>{patient.doctorName}</td>
                    <td>{patient.condition}</td>
                    <td>
                      <span className={`badge ${statusClass(patient.status)}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td>{new Date(patient.lastVisit).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          aria-label={`Edit ${patient.name}`}
                          onClick={() => openEdit(patient)}
                          className="btn btn-secondary p-2"
                          title="Edit patient"
                          type="button"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          aria-label={`Delete ${patient.name}`}
                          onClick={() => remove(patient)}
                          className="btn btn-danger p-2"
                          disabled={deletingId === patient.id}
                          title="Delete patient"
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {data && (
          <div className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span>{data.total} patients</span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </Button>
              <span className="px-2 py-2">
                {page} / {data.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= data.totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Edit patient" : "Add patient"}
      >
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">
            Doctor
            <select
              className="input mt-2"
              value={form.doctorId}
              onChange={(event) =>
                setForm({ ...form, doctorId: event.target.value })
              }
              required
            >
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} — {option.specialization}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Name
            <input
              className="input mt-2"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>
          <label className="text-sm font-bold">
            Age
            <input
              className="input mt-2"
              type="number"
              min="0"
              max="130"
              value={form.age}
              onChange={(event) =>
                setForm({ ...form, age: Number(event.target.value) })
              }
              required
            />
          </label>
          <label className="text-sm font-bold">
            Gender
            <select
              className="input mt-2"
              value={form.gender}
              onChange={(event) =>
                setForm({
                  ...form,
                  gender: event.target.value as Patient["gender"],
                })
              }
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="text-sm font-bold">
            Condition
            <input
              className="input mt-2"
              value={form.condition}
              onChange={(event) =>
                setForm({ ...form, condition: event.target.value })
              }
              required
            />
          </label>
          <label className="text-sm font-bold">
            Status
            <select
              className="input mt-2"
              value={form.status}
              onChange={(event) =>
                setForm({
                  ...form,
                  status: event.target.value as Patient["status"],
                })
              }
            >
              <option value="active">Active</option>
              <option value="monitoring">Monitoring</option>
              <option value="recovered">Recovered</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label className="text-sm font-bold">
            Phone
            <input
              className="input mt-2"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              required
            />
          </label>
          <label className="text-sm font-bold">
            Email
            <input
              className="input mt-2"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label className="text-sm font-bold sm:col-span-2">
            Last visit
            <input
              className="input mt-2"
              type="date"
              value={form.lastVisit}
              onChange={(event) =>
                setForm({ ...form, lastVisit: event.target.value })
              }
              required
            />
          </label>
          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModal(false)}
            >
              Cancel
            </Button>
            <Button disabled={saving} type="submit">
              {saving
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Create patient"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
