import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { serialize } from "cookie";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const agent = await prisma.agent.findUnique({ where: { email } });
  if (!agent || !agent.approved) {
    return NextResponse.json({ error: "Agent not approved" }, { status: 403 });
  }
  if (!bcrypt.compareSync(password, agent.password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const res = NextResponse.json({ success: true });
  // After successful login
  console.log("Setting agent_token cookie for agent:", agent.id, agent.name, agent.email);
  res.headers.set("Set-Cookie", serialize("agent_token", agent.id, { path: "/", httpOnly: true }));
  return res;
}