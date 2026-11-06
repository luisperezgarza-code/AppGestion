import { model, Schema } from "mongoose";

const trainerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    specialty: { type: String, required: true, trim: true },
    schedule: { type: String, required: true, trim: true },
    availability: {
      type: String,
      enum: ["Disponible", "En sesión", "Fuera de horario"],
      default: "Disponible",
    },
    initials: { type: String, trim: true },
    color: { type: String, trim: true },
  },
  { timestamps: true },
);

export const TrainerModel = model("Trainer", trainerSchema);
