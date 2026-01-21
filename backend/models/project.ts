import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },

    status: { type: String, enum: ["ACTIVE", "ARCHIVED", "DELETED"], default: "ACTIVE" },
    isDeleted: { type: Boolean, default: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true } 
);

const Project = mongoose.model("Project", projectSchema);
export default Project;
