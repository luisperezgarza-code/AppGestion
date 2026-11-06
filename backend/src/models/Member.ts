import { model, Schema } from "mongoose";

const memberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    plan: { type: String, required: true, trim: true },
    expiryDate: { type: String, required: true },
    status: {
      type: String,
      enum: ["Activo", "Inactivo", "Pendiente de Pago"],
      default: "Activo",
    },
  },
  { timestamps: true },
);

export const MemberModel = model("Member", memberSchema);
