import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import {
  approveLoan,
  collectionList,
  disburseLoan,
  disbursementList,
  loanPayments,
  recordPayment,
  rejectLoan,
  salesLeads,
  sanctionList,
} from "../controllers/staff.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authenticate);

// requireRole() lets ADMIN through everywhere, so each module only names its own role.
router.get("/sales/leads", requireRole("SALES"), asyncHandler(salesLeads));

router.get("/sanction/loans", requireRole("SANCTION"), asyncHandler(sanctionList));
router.post("/sanction/loans/:id/approve", requireRole("SANCTION"), asyncHandler(approveLoan));
router.post("/sanction/loans/:id/reject", requireRole("SANCTION"), asyncHandler(rejectLoan));

router.get("/disbursement/loans", requireRole("DISBURSEMENT"), asyncHandler(disbursementList));
router.post("/disbursement/loans/:id/disburse", requireRole("DISBURSEMENT"), asyncHandler(disburseLoan));

router.get("/collection/loans", requireRole("COLLECTION"), asyncHandler(collectionList));
router.get("/collection/loans/:id/payments", requireRole("COLLECTION"), asyncHandler(loanPayments));
router.post("/collection/loans/:id/payments", requireRole("COLLECTION"), asyncHandler(recordPayment));

export default router;
