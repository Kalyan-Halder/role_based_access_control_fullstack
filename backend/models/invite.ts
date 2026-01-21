import mongoose from "mongoose";

const schema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ["ADMIN", "MANAGER", "STAFF"], required: true },

  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  acceptedAt: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now },
});

const Invite = mongoose.model("Invite", schema);
export default Invite;
