import { Request, Response } from "express";

import ActivityModel from "@/models/Activity";
import ProductModel from "@/models/Product";
import UserModel from "@/models/User";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const globalSearch = async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim();

  if (q.length < 2) {
    return res.json({
      products: [],
      members: [],
      activities: []
    });
  }

  const regex = new RegExp(escapeRegex(q), "i");

  const [products, members, activities] = await Promise.all([
    ProductModel.find({
      $or: [{ name: regex }, { description: regex }, { category: regex }]
    })
      .select("name category status price stock")
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean(),
    UserModel.find({
      $or: [{ name: regex }, { email: regex }]
    })
      .select("name email role avatar")
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean(),
    ActivityModel.find({
      action: regex
    })
      .populate("user", "name email role")
      .select("action entityType entityId createdAt user")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean()
  ]);

  return res.json({
    products,
    members,
    activities
  });
};
