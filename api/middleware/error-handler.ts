import { NextFunction, Request, Response } from "express";
import { Error as MongooseError } from "mongoose";

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    message: "Route not found",
    method: req.method,
    path: req.originalUrl
  });
};

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof MongooseError.ValidationError || error instanceof MongooseError.CastError) {
    return res.status(400).json({ message: error.message });
  }

  const message = error.message || "Internal server error";
  res.status(500).json({ message });
};
