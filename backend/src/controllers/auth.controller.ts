import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User";
import { HttpError } from "../utils/httpError";
import { signToken } from "../utils/token";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function publicUser(user: { _id: unknown; name: string; email: string; role: string }) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}

// Public signup always creates a BORROWER. Staff accounts come from the seed script.
export async function signup(req: Request, res: Response) {
  const body = signupSchema.parse(req.body);
  const exists = await User.exists({ email: body.email.toLowerCase() });
  if (exists) throw new HttpError(409, "An account with this email already exists");

  const user = await User.create({
    name: body.name,
    email: body.email,
    password: await bcrypt.hash(body.password, 10),
    role: "BORROWER",
  });

  const token = signToken({ sub: String(user._id), role: user.role });
  res.status(201).json({ token, user: publicUser(user) });
}

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);
  const user = await User.findOne({ email: body.email.toLowerCase() }).select("+password");
  const ok = user && (await bcrypt.compare(body.password, user.password));
  if (!user || !ok) throw new HttpError(401, "Invalid email or password");

  const token = signToken({ sub: String(user._id), role: user.role });
  res.json({ token, user: publicUser(user) });
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(req.auth!.userId);
  if (!user) throw new HttpError(401, "Account no longer exists");
  res.json({ user: publicUser(user) });
}
