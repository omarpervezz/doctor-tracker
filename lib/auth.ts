import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "doctor_tracker_session";

const configuredSecret = process.env.JWT_SECRET;

if (!configuredSecret && process.env.NODE_ENV === "production") {
  throw new Error(
    "Missing JWT_SECRET environment variable. Configure a long random secret before starting the production application.",
  );
}

const secret = new TextEncoder().encode(
  configuredSecret || "doctor-tracker-local-development-secret-only",
);

export type SessionPayload = {
  userId: string;
  email: string;
  role: "admin";
};

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}
