import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

export const uploadRoot = path.resolve(env.uploadDir);
fs.mkdirSync(uploadRoot, { recursive: true });

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

export const salarySlipUpload = multer({
  storage: multer.diskStorage({
    destination: uploadRoot,
    filename: (_req, file, cb) => {
      cb(null, `${crypto.randomUUID()}${ALLOWED_TYPES[file.mimetype] ?? ""}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES[file.mimetype]) {
      return cb(new HttpError(400, "Only PDF, JPG or PNG files are allowed"));
    }
    cb(null, true);
  },
}).single("salarySlip");
