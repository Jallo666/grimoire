import { NextResponse } from "next/server";
import { db } from "@/db";
import { campaigns } from "@/db/schema";

// GET /api/campaigns → lista tutte le campagne
export async function GET() {
  const result = await db.select().from(campaigns);
  return NextResponse.json(result);
}

// POST /api/campaigns → crea una nuova campagna
export async function POST(request: Request) {
  const body = await request.json();
  const result = await db
    .insert(campaigns)
    .values({
      nome: body.nome,
      ownerId: 1, // utente finto per ora, auth vera in seguito
    })
    .returning();
  return NextResponse.json(result[0]);
}
