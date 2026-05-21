import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { adminLoginSchema } from "@/lib/validations";
import { createAdminSession } from "@/lib/auth";
import { badRequest, ok, serverError } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const body = adminLoginSchema.parse(await request.json());
    const admin = await prisma.adminUser.findUnique({ where: { email: body.email } });

    if (!admin) {
      return badRequest("Invalid email or password");
    }

    const valid = await bcrypt.compare(body.password, admin.passwordHash);
    if (!valid) {
      return badRequest("Invalid email or password");
    }

    await createAdminSession(admin.id);
    return ok({ id: admin.id, email: admin.email, name: admin.name });
  } catch (error) {
    return serverError(error);
  }
}
