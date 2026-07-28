"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit3, FilterX, Plus, Search, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import {
  DoctorPatientsModal,
  type DoctorSummary,
} from "./doctor-patients-modal";

type Doctor = DoctorSummary & {
  phone: string;
  email: string;
  createdAt: string;
};

const empty = {
  name: "",
  specialization: "",
  hospital: "",
  phone: "",
  email: "",
};

export function DoctorsClient() {
  const [data, setData] = useState<{
    items: Doctor[];
    page: number;
    totalPages: number;
    total: number;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hospital, setHospital] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const query = new URLSearchParams({ page: String(page), limit: "10" });
      if (search.trim()) query.set("search", search.trim());
      if (specialization.trim()) {
        query.set("specialization", specialization.trim());
      }
      if (hospital.trim()) query.set("hospital", hospital.trim());
      if (from) query.set("from", from);
      if (to) query.set("to", to);

      setLoadError("");
      try {
        const response = await fetch(`/api/doctors?${query}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load doctors");
        }
        setData(payload.data);
        if (page > payload.data.totalPages) {
          setPage(payload.data.totalPages);
        }
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") {
          setLoadError(
            (requestError as Error).message || "Unable to load doctors",
          );
          setData(null);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [from, hospital, page, refreshKey, search, specialization, to]);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setError("");
    setModal(true);
  }

  function openEdit(doctor: Doctor) {
    setEditing(doctor);
    setForm({
      name: doctor.name,
      specialization: doctor.specialization,
      hospital: doctor.hospital,
      phone: doctor.phone,
      email: doctor.email,
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
        editing ? `/api/doctors/${editing.id}` : "/api/doctors",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Unable to save doctor");
        return;
      }
      setModal(false);
      refresh();
    } catch {
      setError("Unable to save doctor. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const handleCloseModal = useCallback(() => {
    setModal(false);
  }, []);

  async function remove(doctor: Doctor) {
    if (!window.confirm(`Delete ${doctor.name}?`)) return;

    setDeletingId(doctor.id);
    setLoadError("");
    try {
      const response = await fetch(`/api/doctors/${doctor.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete doctor");
      }
      refresh();
    } catch (requestError) {
      setLoadError(
        (requestError as Error).message || "Unable to delete doctor",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setSpecialization("");
    setHospital("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  const hasFilters = Boolean(
    search || specialization || hospital || from || to,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-blue-600">CARE NETWORK</p>
          <h2 className="text-3xl font-black">Doctors</h2>
          <p className="text-slate-500">
            Create, filter and manage the clinical team and their patients.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} />
          Add doctor
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
              placeholder="Search name, hospital, specialty or email"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <input
            className="input"
            placeholder="Specialization"
            value={specialization}
            onChange={(event) => {
              setSpecialization(event.target.value);
              setPage(1);
            }}
          />
          <input
            className="input"
            placeholder="Hospital"
            value={hospital}
            onChange={(event) => {
              setHospital(event.target.value);
              setPage(1);
            }}
          />
          <input
            aria-label="Doctors added from"
            className="input"
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
          />
          <input
            aria-label="Doctors added to"
            className="input"
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
          />
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
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Hospital</th>
                  <th>Patients</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((doctor) => (
                  <tr key={doctor.id}>
                    <td>
                      <b>{doctor.name}</b>
                      <div className="text-xs text-slate-500">
                        Added {new Date(doctor.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>{doctor.specialization}</td>
                    <td>{doctor.hospital}</td>
                    <td>
                      <button
                        aria-label={`View ${doctor.name}'s patients`}
                        className="badge cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100"
                        onClick={() => setSelectedDoctor(doctor)}
                        title="View and manage patients"
                        type="button"
                      >
                        <Users size={13} className="mr-1" />
                        {doctor.patientCount}
                      </button>
                    </td>
                    <td>
                      <div>{doctor.email}</div>
                      <div className="text-xs text-slate-500">
                        {doctor.phone}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          aria-label={`Edit ${doctor.name}`}
                          onClick={() => openEdit(doctor)}
                          className="btn btn-secondary p-2"
                          title="Edit doctor"
                          type="button"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          aria-label={`Delete ${doctor.name}`}
                          onClick={() => remove(doctor)}
                          className="btn btn-danger p-2"
                          disabled={deletingId === doctor.id}
                          title="Delete doctor"
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
            <span>{data.total} doctors</span>
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
        onClose={handleCloseModal}
        title={editing ? "Edit doctor" : "Add doctor"}
      >
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          {Object.entries(form).map(([key, value]) => (
            <label key={key} className="text-sm font-bold capitalize">
              {key}
              <input
                className="input mt-2"
                type={key === "email" ? "email" : "text"}
                value={value}
                onChange={(event) =>
                  setForm({ ...form, [key]: event.target.value })
                }
                required
              />
            </label>
          ))}
          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button disabled={saving} type="submit">
              {saving ? "Saving…" : editing ? "Save changes" : "Create doctor"}
            </Button>
          </div>
        </form>
      </Modal>

      <DoctorPatientsModal
        doctor={selectedDoctor}
        open={Boolean(selectedDoctor)}
        onClose={() => setSelectedDoctor(null)}
        onPatientCountChanged={refresh}
      />
    </div>
  );
}
