import { Document, Model, Schema, model, models } from "mongoose";

export interface IActivityDocument extends Document {
  user: Schema.Types.ObjectId;
  action: string;
  entityType: "product" | "team" | "system";
  entityId: string;
  metadata?: Record<string, string | number | boolean>;
}

const ActivitySchema = new Schema<IActivityDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    entityType: {
      type: String,
      enum: ["product", "team", "system"],
      required: true
    },
    entityId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

const ActivityModel =
  (models.Activity as Model<IActivityDocument>) || model<IActivityDocument>("Activity", ActivitySchema);

export default ActivityModel;
