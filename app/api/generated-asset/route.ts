import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name');
  if (!name || name.includes('/') || name.includes('..')) {
    return NextResponse.json({ error: 'Invalid asset name' }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'backend', 'outputs', name);
  try {
    const file = await fs.readFile(filePath);
    const extension = path.extname(name).toLowerCase();
    const contentType = extension === '.png' ? 'image/png' : 'application/octet-stream';
    return new Response(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }
}
