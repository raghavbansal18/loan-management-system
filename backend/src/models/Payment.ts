import { Schema, model, Types } from "mongoose";

export interface IPayment {
  loan: Types.ObjectId;
  utr: string;
  amount: number;
  paidOn: Date;
  recordedBy: Types.ObjectId;
}

const paymentSchema = new Schema<IPayment>(
  {
    loan: { type: Schema.Types.ObjectId, ref: "Loan", required: true, index: true },
    // The unique index is what actually guarantees no duplicate UTRs, even under concurrent requests.
    utr: { type: String, required: true, unique: true, uppercase: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    paidOn: { type: Date, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Payment = model<IPayment>("Payment", paymentSchema);
