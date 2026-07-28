import { ObjectId, type Filter } from "mongodb";

import { getDb } from "@/lib/mongodb";
import type { DoctorModel } from "../types/doctor.model";

async function collection() {
  return (await getDb()).collection<DoctorModel>("doctors");
}

export async function ensureDoctorIndexes() {
  const doctors = await collection();
  await doctors.createIndexes([
    { key: { email: 1 }, unique: true },
    { key: { createdAt: -1 } },
    { key: { specialization: 1, createdAt: -1 } },
    { key: { hospital: 1, createdAt: -1 } },
    {
      key: {
        name: "text",
        specialization: "text",
        hospital: "text",
        email: "text",
      },
    },
  ]);
}

export async function insertDoctor(data: Omit<DoctorModel, "_id">) {
  const doctors = await collection();
  const result = await doctors.insertOne(data as DoctorModel);
  return { _id: result.insertedId, ...data };
}

export async function findDoctorById(id: string) {
  if (!ObjectId.isValid(id)) return null;
  return (await collection()).findOne({ _id: new ObjectId(id) });
}

export async function updateDoctorById(
  id: string,
  data: Partial<DoctorModel>,
) {
  if (!ObjectId.isValid(id)) return null;
  return (await collection()).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: data },
    { returnDocument: "after" },
  );
}

export async function deleteDoctorById(id: string) {
  if (!ObjectId.isValid(id)) return false;
  const result = await (await collection()).deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export async function listDoctors(query: {
  search?: string;
  specialization?: string;
  hospital?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}) {
  const filter: Filter<DoctorModel> = {};

  if (query.search?.trim()) {
    filter.$text = { $search: query.search.trim() };
  }
  if (query.specialization?.trim()) {
    filter.specialization = new RegExp(query.specialization.trim(), "i");
  }
  if (query.hospital?.trim()) {
    filter.hospital = new RegExp(query.hospital.trim(), "i");
  }
  if (query.from || query.to) {
    filter.createdAt = {
      ...(query.from ? { $gte: query.from } : {}),
      ...(query.to ? { $lte: query.to } : {}),
    };
  }

  const doctors = await collection();
  const [items, total] = await Promise.all([
    doctors
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .toArray(),
    doctors.countDocuments(filter),
  ]);

  return { items, total };
}

export async function listDoctorOptions() {
  return (await collection())
    .find({}, { projection: { name: 1, specialization: 1 } })
    .sort({ name: 1 })
    .toArray();
}
