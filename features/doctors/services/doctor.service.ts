import { ObjectId } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { failureResult, successResult } from "@/lib/service-result";
import { toDoctorDto } from "../mappers/doctor.mapper";
import {
  deleteDoctorById,
  findDoctorById,
  insertDoctor,
  listDoctorOptions,
  listDoctors,
  updateDoctorById,
} from "../repositories/doctor.repository";
import {
  createDoctorSchema,
  updateDoctorSchema,
} from "../validations/doctor.schema";

function parseDate(value?: string, endOfDay = false) {
  if (!value) return undefined;
  const date = new Date(endOfDay ? `${value}T23:59:59.999Z` : value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function createDoctor(input: unknown) {
  const parsed = createDoctorSchema.safeParse(input);
  if (!parsed.success) {
    return failureResult(
      parsed.error.issues[0]?.message || "Invalid doctor data",
    );
  }

  try {
    const now = new Date();
    const doctor = await insertDoctor({
      ...parsed.data,
      createdAt: now,
      updatedAt: now,
    });
    return successResult(toDoctorDto(doctor));
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return failureResult(
        "A doctor with this email already exists",
        "DUPLICATE_EMAIL",
      );
    }
    return failureResult("Failed to create doctor");
  }
}

export async function updateDoctor(id: string, input: unknown) {
  const parsed = updateDoctorSchema.safeParse(input);
  if (!parsed.success) {
    return failureResult(
      parsed.error.issues[0]?.message || "Invalid doctor data",
    );
  }

  try {
    const doctor = await updateDoctorById(id, {
      ...parsed.data,
      updatedAt: new Date(),
    });
    return doctor
      ? successResult(toDoctorDto(doctor))
      : failureResult("Doctor not found", "NOT_FOUND");
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return failureResult(
        "A doctor with this email already exists",
        "DUPLICATE_EMAIL",
      );
    }
    return failureResult("Failed to update doctor");
  }
}

export async function removeDoctor(id: string) {
  const doctor = await findDoctorById(id);
  if (!doctor) return failureResult("Doctor not found", "NOT_FOUND");

  const db = await getDb();
  const patientCount = await db.collection("patients").countDocuments({
    doctorId: new ObjectId(id),
  });
  if (patientCount > 0) {
    return failureResult(
      "Reassign or delete this doctor's patients first",
      "HAS_PATIENTS",
    );
  }

  return (await deleteDoctorById(id))
    ? successResult(undefined)
    : failureResult("Failed to delete doctor");
}

export async function getDoctor(id: string) {
  const doctor = await findDoctorById(id);
  if (!doctor) return failureResult("Doctor not found", "NOT_FOUND");

  const patientCount = await (await getDb())
    .collection("patients")
    .countDocuments({ doctorId: doctor._id });

  return successResult(toDoctorDto(doctor, patientCount));
}

export async function getDoctors(query: {
  search?: string;
  specialization?: string;
  hospital?: string;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}) {
  const result = await listDoctors({
    ...query,
    from: parseDate(query.from),
    to: parseDate(query.to, true),
  });

  const db = await getDb();
  const doctorIds = result.items.map((doctor) => doctor._id);
  const counts = doctorIds.length
    ? await db
        .collection("patients")
        .aggregate([
          { $match: { doctorId: { $in: doctorIds } } },
          { $group: { _id: "$doctorId", count: { $sum: 1 } } },
        ])
        .toArray()
    : [];
  const countByDoctor = new Map<string, number>(
    counts.map((item) => [String(item._id), Number(item.count)]),
  );

  return successResult({
    items: result.items.map((doctor) =>
      toDoctorDto(doctor, countByDoctor.get(doctor._id.toString()) || 0),
    ),
    page: query.page,
    limit: query.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / query.limit)),
  });
}

export async function getDoctorOptions() {
  const doctors = await listDoctorOptions();
  return successResult(
    doctors.map((doctor) => ({
      id: doctor._id.toString(),
      name: doctor.name,
      specialization: doctor.specialization,
    })),
  );
}
