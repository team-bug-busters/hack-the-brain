import { verifyToken } from "@clerk/backend";
import User from "../models/User.js";

export default async function clerkAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];

    // Use verifyToken instead of verifyJwt
    const { payload } = await verifyToken(token);

    let user = await User.findOne({ clerkId: payload.sub });
    if (!user) {
      user = await User.create({
        clerkId: payload.sub,
        email: payload.email,
        name: payload.name,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
