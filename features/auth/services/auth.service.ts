import bcrypt from "bcryptjs";
import { createSessionToken } from "@/lib/auth";
import { failureResult, successResult } from "@/lib/service-result";
import { findUserByEmail } from "../repositories/user.repository";
import { loginSchema } from "../validations/auth.schema";
export async function login(input: unknown) {
  const parsed = loginSchema.safeParse(input); if (!parsed.success) return failureResult("Enter a valid email and password");
  const user = await findUserByEmail(parsed.data.email); if (!user) return failureResult("Invalid email or password");
  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash); if (!valid) return failureResult("Invalid email or password");
  const token = await createSessionToken({ userId: user._id.toString(), email: user.email, role: user.role });
  return successResult({ token, user: { id: user._id.toString(), email: user.email, role: user.role } });
}
