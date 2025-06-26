import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true }, // Clerk's user ID
  email: { type: String, required: true },
  name: { type: String },
  // Add any custom fields you want to store
});

const User = mongoose.model("User", userSchema);
export default User;
