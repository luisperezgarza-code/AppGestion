import mongoose from "mongoose";
import { TrainerModel } from "../models/Trainer.js";
import { asyncHandler } from "./asyncHandler.js";

export const listTrainers = asyncHandler(async (_request, response) => {
  const trainers = await TrainerModel.find().sort({ createdAt: -1 }).lean();
  response.json({ data: trainers });
});

export const createTrainer = asyncHandler(async (request, response) => {
  const trainer = await TrainerModel.create(request.body);
  response.status(201).json({ data: trainer });
});

export const updateTrainer = asyncHandler(async (request, response) => {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    response.status(400).json({ error: "El identificador del entrenador no es válido." });
    return;
  }

  const trainer = await TrainerModel.findByIdAndUpdate(id, request.body, {
    new: true,
    runValidators: true,
  });
  if (!trainer) {
    response.status(404).json({ error: "No se encontró el entrenador." });
    return;
  }
  response.json({ data: trainer });
});

export const deleteTrainer = asyncHandler(async (request, response) => {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    response.status(400).json({ error: "El identificador del entrenador no es válido." });
    return;
  }

  const trainer = await TrainerModel.findByIdAndDelete(id);
  if (!trainer) {
    response.status(404).json({ error: "No se encontró el entrenador." });
    return;
  }
  response.status(204).end();
});
