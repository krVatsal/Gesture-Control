import { NextResponse } from "next/server";
import UserModel from "@/models/user.model";
const saveCanvas= async (request: Request)=> {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail || typeof userEmail !== 'string') {
      return NextResponse.json({ message: 'Invalid email' }, { status: 400 });
    }

    const body = await request.json();
    const { shapes } = body;

    if (!shapes) {
      return NextResponse.json({ message: 'Request body is missing shapes' }, { status: 400 });
    }

    const result = await UserModel.findOneAndUpdate(
      { email: userEmail },
      { $set: { shapes } },
      { new: true }
    );

    if (!result) {
      return NextResponse.json({ message: 'Canvas not found' }, { status: 404 });
    }

    return NextResponse.json({ status: 200, result, message: 'Canvas saved successfully' });
  } catch (error: any) {
    console.error('Error saving canvas:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to save canvas' }, { status: 500 });
  }
}

const loadCanvas=  async (userEmail: string)=> {
  if (!userEmail || typeof userEmail !== 'string') {
    throw new Error("Invalid email");
  }

  const canvas = await UserModel.findOne({ email: userEmail }).select("shapes");
  if (!canvas) {
    throw new Error("Canvas not found");
  }

  return { status: 200, canvas, message: "Canvas loaded successfully" };
}

export {loadCanvas, saveCanvas}