import { getDb } from "@/lib/mongodb";
import type { UserModel } from "../types/user.model";
async function collection() { return (await getDb()).collection<UserModel>("users"); }
export async function findUserByEmail(email: string) { return (await collection()).findOne({ email: email.toLowerCase() }); }
export async function ensureUserIndexes() { await (await collection()).createIndex({ email: 1 }, { unique: true }); }
