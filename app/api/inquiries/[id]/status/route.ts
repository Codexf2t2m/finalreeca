import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { status } = await req.json();
  const inquiry = await prisma.inquiry.update({
    where: { id: params.id },
    data: { status },
  });
  return NextResponse.json({ success: true, inquiry });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.inquiry.delete({
    where: { id: params.id },
  });
  return NextResponse.json({ success: true });
}