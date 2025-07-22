import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const agentId = cookieStore.get("agent_token")?.value;
  console.log("Read agent_token from cookies:", agentId);
  if (!agentId) return NextResponse.json({}, { status: 401 });
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return NextResponse.json({}, { status: 401 });
  return NextResponse.json({ name: agent.name, email: agent.email });
}