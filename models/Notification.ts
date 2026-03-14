import { Document, Model, Schema, model, models } from "mongoose";

export interface INotificationDocument extends Document {
  userId: Schema.Types.ObjectId;
  title: string;
  description: string;
  type: "info" | "success" | "warning" | "danger";
  isRead: boolean;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["info", "success", "warning", "danger"],
      default: "info"
    },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const NotificationModel =
  (models.Notification as Model<INotificationDocument>) ||
  model<INotificationDocument>("Notification", NotificationSchema);

export default NotificationModel;
