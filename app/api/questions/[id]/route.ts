import { requireAdminApi } from "@/lib/auth";
import { ok, serverError, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { questionSchema } from "@/lib/validations";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const admin = await requireAdminApi();
  if (!admin) {
    return unauthorized();
  }

  try {
    const { id } = await context.params;
    const body = questionSchema.partial().parse(await request.json());
    const question = await prisma.question.update({
      where: { id },
      data: {
        ...body,
        imageUrl: body.imageUrl || null,
        explanation: body.explanation || null
      }
    });

    return ok({ question });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  const admin = await requireAdminApi();
  if (!admin) {
    return unauthorized();
  }

  try {
    const { id } = await context.params;
    await prisma.question.delete({ where: { id } });
    return ok({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
