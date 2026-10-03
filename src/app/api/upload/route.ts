import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { requireApiPharmacy } from '@/lib/access';

export async function POST(request: Request): Promise<NextResponse> {
  const pharmacy = await requireApiPharmacy();
  if (pharmacy instanceof NextResponse) return pharmacy;

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json(
      { error: 'Filename is required' },
      { status: 400 }
    );
  }

  try {
    const blob = await put(filename, request.body!, {
      access: 'public',
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Vercel Blob upload failed:", error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
