import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },

    status: {
      type: String,
      enum: ["ACTIVE", "ARCHIVED", "DELETED"],
      default: "ACTIVE",
    },
    isDeleted: { type: Boolean, default: false },

    userID:{
      type:String,
      default:""
    },
    creator_Name:{
      type:String
    },
    creator_Email:{
      type:String
    }
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);
export default Project;

