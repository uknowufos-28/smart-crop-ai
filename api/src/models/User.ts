import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "farmer" | "agronomist" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Omit password field from default query results for security
    },
    role: {
      type: String,
      enum: ["farmer", "agronomist", "admin"],
      default: "farmer",
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>("User", userSchema);
