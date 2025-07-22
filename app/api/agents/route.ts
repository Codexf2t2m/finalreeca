import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const agents = await prisma.agent.findMany({
    select: { id: true, name: true, email: true, approved: true }
  });
  return NextResponse.json({ agents });
}