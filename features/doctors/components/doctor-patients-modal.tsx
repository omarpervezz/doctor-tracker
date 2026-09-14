"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Trash2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";

export type DoctorSummary = {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  patientCount: number;
};

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
  gender: "male" | "female" | "other";
  condition: string;
  status: "active" | "monitoring" | "recovered" | "critical";
  phone: string;
  email: string;
  lastVisit: string;
};

function createEmptyForm(doctorId: string): PatientForm {
  return {
    doctorId,
    name: "",
    age: 30,
    gender: "female",
    condition: "",
    status: "active",
    phone: "",
    email: "",
    lastVisit: new Date().toISOString().slice(0, 10),
  };
}

function statusClass(status: Patient["status"]) {
  if (status === "critical") return "bg-red-50 text-red-700";
  if (status === "recovered") return "bg-green-50 text-green-700";
  if (status === "monitoring") return "bg-amber-50 text-amber-700";
  return "bg-blue-50 text-blue-700";
}

export function DoctorPatientsModal({
  doctor,
  open,
  onClose,
  onPatientCountChanged,
}: {
  doctor: DoctorSummary | null;
  open: boolean;
  onClose: () => void;
  onPatientCountChanged: () => void;
}) {
  const [data, setData] = useState<{
    items: Patient[];
    page: number;
    totalPages: number;
    total: number;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [condition, setCondition] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<PatientForm>(createEmptyForm(""));
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    if (!open || !doctor) return;

    setPage(1);
    setSearch("");
    setStatus("");
    setCondition("");
    setFrom("");
    setTo("");
    setShowCreate(false);
    setForm(createEmptyForm(doctor.id));
    setFormError("");
    setLoadError("");
  }, [doctor, open]);

  useEffect(() => {
    if (!open || !doctor) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const query = new URLSearchParams({
        doctorId: doctor.id,
        page: String(page),
        limit: "8",
      });
      if (search.trim()) query.set("search", search.trim());
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
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setLoadError((error as Error).message || "Unable to load patients");
          setData(null);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [condition, doctor, from, open, page, refreshKey, search, status, to]);

  const activeDoctor = doctor;
  if (!activeDoctor) return null;
  const activeDoctorId = activeDoctor.id;
  const activeDoctorName = activeDoctor.name;

  async function createPatient(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) {
        setFormError(payload.error || "Unable to create patient");
        return;
      }

      setShowCreate(false);
      setForm(createEmptyForm(activeDoctorId));
      setPage(1);
      refresh();
      onPatientCountChanged();
    } catch {
      setFormError("Unable to create patient. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function removePatient(patient: Patient) {
    if (!window.confirm(`Delete ${patient.name} from ${activeDoctorName}'s patient list?`)) {
      return;
    }

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
      onPatientCountChanged();
    } catch (error) {
      setLoadError((error as Error).message || "Unable to delete patient");
    } finally {
      setDeletingId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setCondition("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  const hasFilters = Boolean(search || status || condition || from || to);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${activeDoctor.name} — Patients`}
      size="xl"
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold">{activeDoctor.specialization}</p>
            <p className="text-sm text-slate-500">{activeDoctor.hospital}</p>
          </div>
          <Button
            onClick={() => {
              setShowCreate((value) => !value);
              setFormError("");
              setForm(createEmptyForm(activeDoctorId));
            }}
            type="button"
          >
            <Plus size={17} />
            {showCreate ? "Close form" : "Add patient"}
          </Button>
        </div>

        {showCreate && (
          <form
            className="grid gap-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={createPatient}
          >
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
                    gender: event.target.value as PatientForm["gender"],
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
                    status: event.target.value as PatientForm["status"],
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
            <label className="text-sm font-bold">
              Phone
              <input
                className="input mt-2"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                required
              />
            </label>
            <label className="text-sm font-bold lg:col-span-2">
              Email
              <input
                className="input mt-2"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </label>
            {formError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2 lg:col-span-3">
                {formError}
              </p>
            )}
            <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
              <Button disabled={saving} type="submit">
                {saving ? "Creating…" : "Create patient"}
              </Button>
            </div>
          </form>
        )}

        <div className="grid gap-3 lg:grid-cols-6">
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
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}

        {loadError && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="table-wrap">
            {!data ? (
              <div className="skeleton h-72" />
            ) : data.items.length === 0 ? (
              <EmptyState
                title="No patients assigned"
                description={
                  hasFilters
                    ? "Try changing the filters."
                    : `Add the first patient under ${activeDoctor.name}.`
                }
              />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Condition</th>
                    <th>Status</th>
                    <th>Contact</th>
                    <th>Last visit</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
                            <UserRound size={16} />
                          </span>
                          <div>
                            <b>{patient.name}</b>
                            <div className="text-xs text-slate-500">
                              {patient.age} yrs · {patient.gender}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{patient.condition}</td>
                      <td>
                        <span className={`badge ${statusClass(patient.status)}`}>
                          {patient.status}
                        </span>
                      </td>
                      <td>
                        <div>{patient.email}</div>
                        <div className="text-xs text-slate-500">{patient.phone}</div>
                      </td>
                      <td>{new Date(patient.lastVisit).toLocaleDateString()}</td>
                      <td>
                        <button
                          aria-label={`Delete ${patient.name}`}
                          className="btn btn-danger p-2"
                          disabled={deletingId === patient.id}
                          onClick={() => removePatient(patient)}
                          title="Delete patient"
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {data && (
            <div className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span>{data.total} patients assigned</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                  type="button"
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
                  type="button"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
