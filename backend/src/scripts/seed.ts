import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDb } from "../config/db";
import { Role, User } from "../models/User";

const accounts: { name: string; email: string; role: Role }[] = [
  { name: "Admin User", email: "admin@lms.com", role: "ADMIN" },
  { name: "Sales Executive", email: "sales@lms.com", role: "SALES" },
  { name: "Sanction Executive", email: "sanction@lms.com", role: "SANCTION" },
  { name: "Disbursement Executive", email: "disbursement@lms.com", role: "DISBURSEMENT" },
  { name: "Collection Executive", email: "collection@lms.com", role: "COLLECTION" },
  { name: "Demo Borrower", email: "borrower@lms.com", role: "BORROWER" },
];

const PASSWORD = "Password@123";

async function seed() {
  await connectDb();
  const hash = await bcrypt.hash(PASSWORD, 10);

  for (const account of accounts) {
    await User.updateOne(
      { email: account.email },
      { $set: { name: account.name, role: account.role, password: hash } },
      { upsert: true }
    );
    console.log(`${account.role.padEnd(13)} ${account.email}`);
  }
  console.log(`\nPassword for all accounts: ${PASSWORD}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
