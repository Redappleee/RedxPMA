import bcrypt from "bcryptjs";
import { Document, Model, Schema, model, models } from "mongoose";

import { DEFAULT_DASHBOARD_LAYOUT, DASHBOARD_WIDGET_KEYS, DashboardWidgetKey } from "@/types/dashboard";
import { Role } from "@/types";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  avatar?: string;
  preferences: {
    dashboardLayout: DashboardWidgetKey[];
  };
  comparePassword: (password: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 8 },
    role: {
      type: String,
      enum: ["admin", "manager", "member"],
      default: "member"
    },
    avatar: { type: String },
    preferences: {
      dashboardLayout: {
        type: [
          {
            type: String,
            enum: DASHBOARD_WIDGET_KEYS
          }
        ],
        default: () => [...DEFAULT_DASHBOARD_LAYOUT]
      }
    }
  },
  { timestamps: true }
);

UserSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function comparePassword(password: string) {
  return bcrypt.compare(password, this.password);
};

const UserModel = (models.User as Model<IUserDocument>) || model<IUserDocument>("User", UserSchema);

export default UserModel;
