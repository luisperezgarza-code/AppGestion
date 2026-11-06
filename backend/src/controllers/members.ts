import mongoose from "mongoose";
import { MemberModel } from "../models/Member.js";
import { asyncHandler } from "./asyncHandler.js";

export const listMembers = asyncHandler(async (_request, response) => {
  const members = await MemberModel.find().sort({ createdAt: -1 }).lean();
  response.json({ data: members });
});

export const createMember = asyncHandler(async (request, response) => {
  const member = await MemberModel.create(request.body);
  response.status(201).json({ data: member });
});

export const updateMember = asyncHandler(async (request, response) => {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    response.status(400).json({ error: "El identificador del miembro no es válido." });
    return;
  }

  const member = await MemberModel.findByIdAndUpdate(id, request.body, {
    new: true,
    runValidators: true,
  });
  if (!member) {
    response.status(404).json({ error: "No se encontró el miembro." });
    return;
  }
  response.json({ data: member });
});

export const deleteMember = asyncHandler(async (request, response) => {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    response.status(400).json({ error: "El identificador del miembro no es válido." });
    return;
  }

  const member = await MemberModel.findByIdAndDelete(id);
  if (!member) {
    response.status(404).json({ error: "No se encontró el miembro." });
    return;
  }
  response.status(204).end();
});
