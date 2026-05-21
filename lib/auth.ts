import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "quiz_admin_session";

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || "dev-only-change-this-secret";
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export async function createAdminSession(adminId: string) {
  const value = `${adminId}.${Date.now()}`;
  const signed = `${value}.${sign(value)}`;
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, signed, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/"
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;

  if (!session) {
    return null;
  }

  const parts = session.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [adminId, issuedAt, signature] = parts;
  const payload = `${adminId}.${issuedAt}`;
  const expected = sign(payload);
  const valid =
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!valid) {
    return null;
  }

  return prisma.adminUser.findUnique({
    where: { id: adminId },
    select: { id: true, email: true, name: true }
  });
}

export async function requireAdmin() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}

export async function requireAdminApi() {
  const admin = await getAdminUser();

  if (!admin) {
    return null;
  }

  return admin;
}
