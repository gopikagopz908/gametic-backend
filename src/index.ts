import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import ownerRoute from "./Routes/ownerRoute";
import userRouter from "./Routes/userRoutes";
import cors from "cors";
import adminRoute from './Routes/adminRoutes'
import upload from "./Middleware/uploadMulter";
import manageError from "./Middleware/manageError";
import tournamentRouter from "./Routes/tournamentRoutes";


const app = express();
dotenv.config(); 
/* ===============================
   ✅ CORS CONFIG (ONLY ONCE)
================================= */ 
app.use(cors({
  origin: true,
  credentials: true
}));

/* ===============================
   ✅ MIDDLEWARES
================================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ===============================
   ✅ DATABASE CONNECTION
================================= */
if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not defined in environment variables");
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ DB Connected"))
  .catch((err) => {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1);
  });

/* ===============================
   ✅ ROUTES
================================= */
app.use("/api/admin", adminRoute);
app.use("/api", ownerRoute);
app.use("/api", userRouter);
app.use("/api/tournament", tournamentRouter); // 👈 ADD THIS
app.get("/hello", (req, res) => {
  res.json({ message: "Server is working 🚀" });
});

/* ===============================
   ✅ GLOBAL ERROR HANDLER
================================= */
app.use(manageError);

/* ===https://gametic-frontend.vercel.app/============================
   ✅ SERVER START
================================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});