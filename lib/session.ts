import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyToken } from "@/lib/auth";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const result = await db
    .select({ id: users.id, email: users.email, nome: users.nome })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  return result[0] ?? null;
}
