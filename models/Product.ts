import { Document, Model, Schema, model, models } from "mongoose";

import { ProductStatus } from "@/types";

export interface IProductComment {
  user: Schema.Types.ObjectId;
  message: string;
  createdAt: Date;
}

export interface IProductDocument extends Document {
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  image?: string;
  assignedManagers: Schema.Types.ObjectId[];
  comments: IProductComment[];
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "draft"
    },
    image: { type: String },
    assignedManagers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        message: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", description: "text", category: "text" });

const ProductModel =
  (models.Product as Model<IProductDocument>) || model<IProductDocument>("Product", ProductSchema);

export default ProductModel;
