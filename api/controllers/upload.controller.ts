import { Request, Response } from "express";

export const uploadImage = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image is required" });
  }

  return res.status(201).json({
    url: `/uploads/${req.file.filename}`
  });
};
