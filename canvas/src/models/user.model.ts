import mongoose, { Schema, Document } from 'mongoose';

// Message Interface
export interface Message extends Document {
  content: string;
  createdAt: Date;
}

// User Interface
export interface User extends Document {
  firstName: string;
  lastName?: string;
  email: string;
  // password: string;
  accessToken: string
  token:[string]
  shapes: Shape[]
  canvasPages: Array<{
    name: string; // Name or title of the canvas page
    content: string; // Data for the canvas, e.g., serialized JSON or any format
    createdAt: Date; // Timestamp for when the canvas was created
  }>;
}
interface Shape {
  type: string;
  points?: { x: number; y: number }[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  x3?: number;
  y3?: number;
  text?: string;
  color?: string;
}

// Updated User schema
const UserSchema: Schema<User> = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: false,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/.+\@.+\..+/, 'Please use a valid email address'],
  },
  accessToken:{
    type: String,
    required: true
  },
  token:{
    type: [String]
  },
  canvasPages: [
    {
      name: { type: String, required: true }, // Name of the canvas page
      content: { type: String, required: true }, // Canvas data in JSON or other formats
      createdAt: { type: Date, default: Date.now }, // Timestamp
    },
  ],
  shapes: [{
    type: {
      type: String,
      required: true
    },
    points: [{
      x: Number,
      y: Number
    }],
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    radius: Number,
    x1: Number,
    y1: Number,
    x2: Number,
    y2: Number,
    x3: Number,
    y3: Number,
    text: String,
    color: String
  }],
});

const UserModel =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>('User', UserSchema);

export default UserModel;