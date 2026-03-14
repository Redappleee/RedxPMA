import { Document, Model, Schema, model, models } from "mongoose";

export interface IPasswordResetTokenDocument extends Document {
  userId: Schema.Types.ObjectId;
  token: string;
  expiresAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetTokenDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetTokenModel =
  (models.PasswordResetToken as Model<IPasswordResetTokenDocument>) ||
  model<IPasswordResetTokenDocument>("PasswordResetToken", PasswordResetTokenSchema);

export default PasswordResetTokenModel;
