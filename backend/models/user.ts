import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },

    role: { type: String, enum: ["ADMIN", "MANAGER", "STAFF"], default: "STAFF" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },

    invitedAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  const user: any = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

userSchema.methods.comparePassword = async function (plain: string) {
  const user: any = this;
  return bcrypt.compare(plain, user.password);
};

const User = mongoose.model("User", userSchema);
export default User;
