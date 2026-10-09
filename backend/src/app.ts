import express from "express";
import cors from "cors";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import borrowerRoutes from "./routes/borrower.routes";
import staffRoutes from "./routes/staff.routes";
import { errorHandler, notFound } from "./middleware/errorHandler";

export const app = express();

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/borrower", borrowerRoutes);
app.use("/api", staffRoutes);

app.use(notFound);
app.use(errorHandler);
