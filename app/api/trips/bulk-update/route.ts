import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  try {
    const { query } = await request.json();

    // Execute the raw SQL query for bulk updates
    const result = await prisma.$executeRawUnsafe(query);

    return NextResponse.json({ success: true, updatedCount: result });
  } catch (error) {
    console.error('Error bulk updating trips:', error);
    return NextResponse.json(
      { message: 'Failed to bulk update trips', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
