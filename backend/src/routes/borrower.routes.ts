import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { salarySlipUpload } from "../middleware/upload";
import {
  applyForLoan,
  downloadSalarySlip,
  getProfile,
  myLoans,
  saveProfile,
  uploadSalarySlip,
} from "../controllers/borrower.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authenticate);

// Salary slips can also be opened by sanction executives, so this one is outside the borrower-only block.
router.get("/salary-slip/:userId", requireRole("SANCTION"), asyncHandler(downloadSalarySlip));

// Everything below is borrower-only. requireRole lets ADMIN through, which is
// fine for read endpoints but not for applying, so borrowers are checked strictly.
router.use((req, res, next) =>
  req.auth!.role === "BORROWER"
    ? next()
    : res.status(403).json({ message: "Only borrowers can use the application portal" })
);

router.get("/profile", asyncHandler(getProfile));
router.put("/profile", asyncHandler(saveProfile));
router.post("/salary-slip", salarySlipUpload, asyncHandler(uploadSalarySlip));
router.post("/loans", asyncHandler(applyForLoan));
router.get("/loans", asyncHandler(myLoans));

export default router;
