import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendInviteEmail } from "../utils/inviteEmail";

import User from "../models/user";
import Invite from "../models/invite";
import Project from "../models/project";

import { HttpError, asyncHandler } from "../utils/errors";
import { requireAdmin, requireAuth, AuthReq } from "../middleware/auth";

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).send("This is the Home Page");
});

// used for creating the first admin (only when ALLOW_SEED=true)
router.post("/dev/seed-admin",asyncHandler(async (req, res) => {
    if (process.env.ALLOW_SEED !== "true") {
      throw new HttpError(403, "Seeding disabled");
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) throw new HttpError(400, "name, email, password required");

    const emailNorm = String(email).toLowerCase();

    // only allow if no admin present in the dataset
    const adminExists = await User.findOne({ role: "ADMIN" });
    if (adminExists) throw new HttpError(409, "Admin already exists");

    const existing = await User.findOne({ email: emailNorm });
    if (existing) throw new HttpError(409, "User already exists");

    const admin = await User.create({
      name,
      email: emailNorm,
      password,       
      role: "ADMIN",
      status: "ACTIVE",
    });

    res.status(201).json({
      message: "Admin created",
      user: { id: admin._id, name: (admin as any).name, email: (admin as any).email, role: (admin as any).role },
    });
  })
);

// ---------------- AUTH ----------------

// POST /auth/login
router.post("/auth/login", asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) throw new HttpError(400, "email and password required");

    const user: any = await User.findOne({ email: String(email).toLowerCase() }).select("+password role status name email");
    if (!user) throw new HttpError(401, "Invalid credentials");
    if (user.status !== "ACTIVE") throw new HttpError(401, "User inactive");

    const ok = await user.comparePassword(password);
    if (!ok) throw new HttpError(401, "Invalid credentials");

    const secret = process.env.JWT_SECRET;
    const token = jwt.sign({ role: user.role }, secret, { subject: String(user._id), expiresIn: "1d" });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  })
);

// POST /auth/invite (ADMIN)  used for  sending email invite link
router.post("/auth/invite", requireAuth, requireAdmin, asyncHandler(async (req: AuthReq, res) => { 
    const { email, role } = req.body;

    if (!email || !role) throw new HttpError(400, "email and role required");
    if (!["ADMIN", "MANAGER", "STAFF"].includes(role)) throw new HttpError(400, "Invalid role");

    const emailNorm = String(email).trim().toLowerCase().replace(/[\r\n]/g, "");
    if (!/^\S+@\S+\.\S+$/.test(emailNorm)) {
      throw new HttpError(400, "Invalid email");
    }

    const existingUser = await User.findOne({ email: emailNorm });
    if (existingUser) throw new HttpError(409, "User already exists");

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h expiration set

    const invite = await Invite.create({ email: emailNorm, role, token, expiresAt });

    const frontendBase = process.env.FRONTEND_URL || "http://localhost:3000";
    const inviteUrl = `${frontendBase}/register?token=${token}`;

    try {
      await sendInviteEmail(emailNorm, inviteUrl, role, expiresAt);
    } catch (err: any) {
      // remove invite if email failed (keeps DB clean)
      await Invite.deleteOne({ _id: invite._id });

      // log real reason in backend terminal
      console.log("Invite email error:", err?.message || err);

      throw new HttpError(500, err?.message || "Invite email failed");
    }

    res.status(201).json({
      message: "Invite created and email sent",
      invite: {
        id: invite._id,
        email: invite.email,
        role: invite.role,
        token: invite.token,
        expiresAt: invite.expiresAt,
      },
      inviteLink: `/register?token=${token}`,
      inviteUrl,
    });
  })
);



// POST /auth/register-via-invite
router.post("/auth/register-via-invite", asyncHandler(async (req, res) => {
    const { token, name, password } = req.body;

    if (!token || !name || !password) throw new HttpError(400, "token, name, password required");

    const invite: any = await Invite.findOne({ token });
    if (!invite) throw new HttpError(400, "Invalid invite token");
    if (invite.acceptedAt) throw new HttpError(400, "Invite already used");
    if (new Date(invite.expiresAt).getTime() < Date.now()) throw new HttpError(400, "Invite expired");

    const existingUser = await User.findOne({ email: invite.email });
    if (existingUser) throw new HttpError(409, "User already exists");

    const user = await User.create({
      name,
      email: invite.email,
      password,
      role: invite.role,
      status: "ACTIVE",
      invitedAt: new Date(),
    });

    invite.acceptedAt = new Date();
    await invite.save();

    res.status(201).json({
      message: "Registered successfully",
      user: { id: user._id, name: (user as any).name, email: (user as any).email, role: (user as any).role },
    });
  })
);

// ---------------- USERS (ADMIN) ----------------

// GET /users (ADMIN, paginated)
router.get("/users", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(String(req.query.page || "1")), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || "10")), 1), 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);

    res.json({ page, limit, total, items });
  })
);

// PATCH /users/:id/role (ADMIN)
router.patch("/users/:id/role", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (!role) throw new HttpError(400, "role required");
    if (!["ADMIN", "MANAGER", "STAFF"].includes(role)) throw new HttpError(400, "Invalid role");

    const user = await User.findByIdAndUpdate(req.params.id, { role, updatedAt: new Date() }, { new: true });
    if (!user) throw new HttpError(404, "User not found");

    res.json({ message: "Role updated", user });
  })
);

// PATCH /users/:id/status (ADMIN)
router.patch("/users/:id/status", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!status) throw new HttpError(400, "status required");
    if (!["ACTIVE", "INACTIVE"].includes(status)) throw new HttpError(400, "Invalid status");

    const user = await User.findByIdAndUpdate(req.params.id, { status, updatedAt: new Date() }, { new: true });
    if (!user) throw new HttpError(404, "User not found");

    res.json({ message: "Status updated", user });
  })
);

// ---------------- PROJECTS ----------------

// POST /projects (any authenticated user can create)
router.post(
  "/projects",
  requireAuth,
  asyncHandler(async (req: AuthReq, res) => {
    const { name, description , userID } = req.body;

    const userExist = await User.findOne({_id:userID})
    
    if (!name) throw new HttpError(400, "name required");

    const project = await Project.create({
      name,
      description: description || "",
      userID:userID,
      creator_Name: userExist.name,
      creator_Email :userExist.email,
      status: "ACTIVE",
      isDeleted: false,
    });

    res.status(201).json(project);
  })
);


// GET /projects (authenticated)
router.get("/projects", requireAuth, asyncHandler(async (req, res) => {
    const projects = await Project.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.json(projects);
  })
);

// PATCH /projects/:id (ADMIN only)
router.patch("/projects/:id", requireAuth,requireAdmin, asyncHandler(async (req, res) => {
    const updates: any = {};
    const { name, description, status } = req.body;

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) {
      if (!["ACTIVE", "ARCHIVED"].includes(status)) throw new HttpError(400, "Invalid status");
      updates.status = status;
    }

    updates.updatedAt = new Date();

    const project = await Project.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!project) throw new HttpError(404, "Project not found");

    res.json({ message: "Project updated", project });
  })
);

// DELETE /projects/:id (ADMIN only, soft delete)
router.delete( "/projects/:id",requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) throw new HttpError(404, "Project not found");

    (project as any).isDeleted = true;
    (project as any).status = "DELETED";
    (project as any).updatedAt = new Date();

    await project.save();

    res.json({ message: "Project soft-deleted" });
  })
);

export default router;
