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
  svgFiles: string[]; // Array of SVG strings (you can store them as text)
  canvasPages: Array<{
    name: string; // Name or title of the canvas page
    content: string; // Data for the canvas, e.g., serialized JSON or any format
    createdAt: Date; // Timestamp for when the canvas was created
  }>;
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
  // password: {
  //   type: String,
  // },
  svgFiles: {
    type: [String], // Array of strings for SVG files
    default: [], // Default to an empty array
  },
  canvasPages: [
    {
      name: { type: String, required: true }, // Name of the canvas page
      content: { type: String, required: true }, // Canvas data in JSON or other formats
      createdAt: { type: Date, default: Date.now }, // Timestamp
    },
  ],
});

const UserModel =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>('User', UserSchema);

export default UserModel;