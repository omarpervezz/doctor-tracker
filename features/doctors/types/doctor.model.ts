import type { ObjectId } from "mongodb";
export interface DoctorModel { _id: ObjectId; name: string; specialization: string; hospital: string; phone: string; email: string; createdAt: Date; updatedAt: Date; }
