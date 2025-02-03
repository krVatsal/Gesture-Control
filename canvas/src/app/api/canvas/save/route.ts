import { saveCanvas } from "@/controllers/canvas.controllers";
import type { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
    try {
       const result= await saveCanvas(request);
        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error("Error saving canvas:", error.message);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
          
    }
}
