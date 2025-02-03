// src/app/api/canvas/loader/route.ts
import { NextResponse } from 'next/server';
import { loadCanvas } from '@/controllers/canvas.controllers';

export async function GET(request: Request) {
  try {
    // Extract the query parameter from the URL
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    // Validate the email parameter
    if (!userEmail || typeof userEmail !== 'string') {
      return NextResponse.json({ message: "Invalid email" }, { status: 400 });
    }

    // Call the refactored controller with userEmail
    const result = await loadCanvas(userEmail);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error loading canvas:", error.message);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
