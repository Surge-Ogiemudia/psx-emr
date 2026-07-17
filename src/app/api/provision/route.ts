import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== 'Bearer psx-internal-key-123') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { id, name, slug } = body;

    if (!id || !name || !slug) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Insert new pharmacy into Prisma database
    const pharmacy = await prisma.pharmacy.create({
      data: {
        id: id,
        name: name,
        slug: slug,
      },
    });

    return NextResponse.json({ success: true, pharmacy });
  } catch (error) {
    console.error('Provisioning error:', error);
    // If it's a unique constraint violation, it might already exist
    if ((error as any).code === 'P2002') {
       return NextResponse.json({ success: true, message: 'Pharmacy already exists' });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
