import { z } from "zod";
const fields = { name: z.string().trim().min(2).max(100), specialization: z.string().trim().min(2).max(100), hospital: z.string().trim().min(2).max(120), phone: z.string().trim().min(7).max(30), email: z.string().trim().email().toLowerCase() };
export const createDoctorSchema = z.object(fields);
export const updateDoctorSchema = z.object(fields).partial().refine((v) => Object.keys(v).length > 0, "At least one field is required");
