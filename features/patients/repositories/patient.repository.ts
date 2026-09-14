import { ObjectId, type Filter } from "mongodb";

import { getDb } from "@/lib/mongodb";
import type { PatientModel } from "../types/patient.model";

async function collection() {
  return (await getDb()).collection<PatientModel>("patients");
}

export async function ensurePatientIndexes() {
  const patients = await collection();
  await patients.createIndexes([
    { key: { doctorId: 1, createdAt: -1 } },
    { key: { status: 1, createdAt: -1 } },
    { key: { condition: 1, createdAt: -1 } },
    { key: { createdAt: -1 } },
    { key: { name: "text", condition: "text", email: "text" } },
  ]);
}

export async function insertPatient(data: Omit<PatientModel, "_id">) {
  const patients = await collection();
  const result = await patients.insertOne(data as PatientModel);
  return { _id: result.insertedId, ...data };
}

export async function findPatientById(id: string) {
  if (!ObjectId.isValid(id)) return null;
  return (await collection()).findOne({ _id: new ObjectId(id) });
}

export async function updatePatientById(
  id: string,
  data: Partial<PatientModel>,
) {
  if (!ObjectId.isValid(id)) return null;
  return (await collection()).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: data },
    { returnDocument: "after" },
  );
}

export async function deletePatientById(id: string) {
  if (!ObjectId.isValid(id)) return false;
  const result = await (await collection()).deleteOne({
    _id: new ObjectId(id),
  });
  return result.deletedCount === 1;
}

export async function listPatients(query: {
  search?: string;
  doctorId?: string;
  status?: string;
  condition?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}) {
  const filter: Filter<PatientModel> = {};

  if (query.search?.trim()) {
    filter.$text = { $search: query.search.trim() };
  }
  if (query.doctorId && ObjectId.isValid(query.doctorId)) {
    filter.doctorId = new ObjectId(query.doctorId);
  }
  if (query.status) {
    filter.status = query.status as PatientModel["status"];
  }
  if (query.condition?.trim()) {
    filter.condition = new RegExp(query.condition.trim(), "i");
  }
  if (query.from || query.to) {
    filter.createdAt = {
      ...(query.from ? { $gte: query.from } : {}),
      ...(query.to ? { $lte: query.to } : {}),
    };
  }

  const patients = await collection();
  const [items, total] = await Promise.all([
    patients
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .toArray(),
    patients.countDocuments(filter),
  ]);

  return { items, total };
}
