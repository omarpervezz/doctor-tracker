import { ObjectId } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { failureResult, successResult } from "@/lib/service-result";
import { toPatientDto } from "../mappers/patient.mapper";
import {
  deletePatientById,
  findPatientById,
  insertPatient,
  listPatients,
  updatePatientById,
} from "../repositories/patient.repository";
import type { PatientModel } from "../types/patient.model";
import {
  createPatientSchema,
  updatePatientSchema,
} from "../validations/patient.schema";

function parseDate(value?: string, endOfDay = false) {
  if (!value) return undefined;
  const date = new Date(endOfDay ? `${value}T23:59:59.999Z` : value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function doctorExists(id: string) {
  if (!ObjectId.isValid(id)) return false;
  const doctor = await (await getDb()).collection("doctors").findOne(
    { _id: new ObjectId(id) },
    { projection: { _id: 1 } },
  );
  return Boolean(doctor);
}

export async function createPatient(input: unknown) {
  const parsed = createPatientSchema.safeParse(input);
  if (!parsed.success) {
    return failureResult(
      parsed.error.issues[0]?.message || "Invalid patient data",
    );
  }
  if (!(await doctorExists(parsed.data.doctorId))) {
    return failureResult("Selected doctor does not exist");
  }

  const now = new Date();
  const patient = await insertPatient({
    ...parsed.data,
    doctorId: new ObjectId(parsed.data.doctorId),
    lastVisit: new Date(parsed.data.lastVisit),
    createdAt: now,
    updatedAt: now,
  });
  return successResult(toPatientDto(patient));
}

export async function updatePatient(id: string, input: unknown) {
  const parsed = updatePatientSchema.safeParse(input);
  if (!parsed.success) {
    return failureResult(
      parsed.error.issues[0]?.message || "Invalid patient data",
    );
  }
  if (parsed.data.doctorId && !(await doctorExists(parsed.data.doctorId))) {
    return failureResult("Selected doctor does not exist");
  }

  const data: Partial<PatientModel> = {
    ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
    ...(parsed.data.age !== undefined ? { age: parsed.data.age } : {}),
    ...(parsed.data.gender !== undefined ? { gender: parsed.data.gender } : {}),
    ...(parsed.data.condition !== undefined
      ? { condition: parsed.data.condition }
      : {}),
    ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
    ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
    ...(parsed.data.email !== undefined ? { email: parsed.data.email } : {}),
    ...(parsed.data.doctorId
      ? { doctorId: new ObjectId(parsed.data.doctorId) }
      : {}),
    ...(parsed.data.lastVisit
      ? { lastVisit: new Date(parsed.data.lastVisit) }
      : {}),
    updatedAt: new Date(),
  };

  const patient = await updatePatientById(id, data);
  return patient
    ? successResult(toPatientDto(patient))
    : failureResult("Patient not found", "NOT_FOUND");
}

export async function removePatient(id: string) {
  return (await deletePatientById(id))
    ? successResult(undefined)
    : failureResult("Patient not found", "NOT_FOUND");
}

export async function getPatient(id: string) {
  const patient = await findPatientById(id);
  if (!patient) return failureResult("Patient not found", "NOT_FOUND");

  const doctor = await (await getDb()).collection("doctors").findOne(
    { _id: patient.doctorId },
    { projection: { name: 1 } },
  );
  return successResult(
    toPatientDto(patient, (doctor?.name as string) || "Unknown doctor"),
  );
}

export async function getPatients(query: {
  search?: string;
  doctorId?: string;
  status?: string;
  condition?: string;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}) {
  if (query.doctorId && !ObjectId.isValid(query.doctorId)) {
    return failureResult("Invalid doctor filter");
  }

  const result = await listPatients({
    ...query,
    from: parseDate(query.from),
    to: parseDate(query.to, true),
  });

  const doctorIds = [
    ...new Set(result.items.map((patient) => patient.doctorId.toString())),
  ].map((id) => new ObjectId(id));
  const doctors = doctorIds.length
    ? await (await getDb())
        .collection("doctors")
        .find(
          { _id: { $in: doctorIds } },
          { projection: { name: 1 } },
        )
        .toArray()
    : [];
  const doctorNameById = new Map<string, string>(
    doctors.map((doctor) => [String(doctor._id), String(doctor.name)]),
  );

  return successResult({
    items: result.items.map((patient) =>
      toPatientDto(
        patient,
        doctorNameById.get(patient.doctorId.toString()) || "Unknown doctor",
      ),
    ),
    page: query.page,
    limit: query.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / query.limit)),
  });
}
