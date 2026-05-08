import { NextFunction, Request, Response } from "express";
import { RegisterUserInput, UserPayload } from "../Type/user";
import { loginValidation, registerValidation } from "../utils/userValidation";
import { ValidationError } from "joi";
import asyncHandler from "../Middleware/asyncHandler";
import {
  getLoginedUserDetails,
  loginService,
  registerUserService,
  updateUserService,
} from "../Service/userService";
import { CustomError } from "../utils/customError";
import User from "../Model/userModel";
import crypto from "crypto";
import { sendOtp } from "../utils/sentEmail";
import { OAuth2Client } from "google-auth-library";
import { generateRefreshToken, generateToken } from "../utils/generateToken";
import OtpModel from "../Model/otpModel";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string | undefined;
  };
}

export const registerUser = asyncHandler(
  async (
    req: Request<{}, {}, RegisterUserInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    console.log(req.body);
    const { username, email, password, role } = req.body;

    const { error }: { error?: ValidationError } = registerValidation.validate({
      username,
      email,
      password,
      role,
    });

    if (error) {
      return next(new CustomError(error.details[0].message, 400));
    }
    const existingUser = await User.findOne({ $or: [{ username }] });
    if (existingUser) {
      return next(new CustomError("username already exists", 400));
    }

    const user = await registerUserService({
      username: username,
      email: email,
      password: password,
      role,
      picture: "",
      sign: "local",
    });

    const tokenPayload: UserPayload = {
      _id: user.id,
      email: user.email || "",
      role: user.role || "user",
      picture: user.picture ?? "",
      username: user.username || "",
    };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: 50 * 60 * 1000,
      path: "/",
      sameSite: "none",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
      sameSite: "none",
    });

    res.status(201).json({
      message: `User ${username} registered successfully!`,
      user,
      role: user.role,
      accessToken,
      refreshToken,
    });
  }
);

export const loginUser = asyncHandler(
  async (
    req: Request<{}, {}, RegisterUserInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { email, password } = req.body;
    const { error }: { error?: ValidationError } = loginValidation.validate({
      email,
      password,
    });
    if (error) {
      return next(new CustomError(error.details[0].message, 400));
    }

    const { accessToken, refreshToken, user } = await loginService({
      email,
      password,
    });
    console.log(
      accessToken,
      "accessToken,refreshToken,user................"
    );




    // Make all cookies consistent for cross-origin
    res.cookie("role", user.role, {
      httpOnly: false, // Keep false if you need to access it from JS
      secure: true,
      sameSite: "strict", // Change this to "none"
      path: "/",
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true, // Use environment check here too
      maxAge: 50 * 60 * 1000,
      path: "/",
      sameSite: "strict",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true, // Use environment check here too
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
      sameSite: "strict",
    });
    res.status(200).json({
      message: `Login successful! Welcome back,`,
      user,
    });
  }
);

export const logOut = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });

  res.status(200).json({ message: "user logout successfully" });
});

const generateOTP = (): string => {
  return "123456";
};

export const emailVerification = asyncHandler(
  async (
    req: Request<{}, {}, RegisterUserInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { email } = req.body;

    console.log(email, "emailll")

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new CustomError("User already exists", 404));
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    console.log(otp);

    try {
      const send = await sendOtp(email, otp);
      console.log(send, "send");
    } catch (error) {
      console.log(error, "hiii");
    }

    await OtpModel.deleteMany({ email });

    await OtpModel.create({ email, otp, expiresAt });

    res.status(201).json({ message: "OTP sent to email" });
  }
);

export const verifyOtp = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, otp } = req.body;
    console.log(req.body);

    const existingOtp = await OtpModel.findOne({ email });

    if (!existingOtp) {
      return next(new CustomError("No email verification requested", 400));
    }

    if (Date.now() > existingOtp.expiresAt.getTime()) {
      return next(new CustomError("OTP expired", 400));
    }

    if (existingOtp.otp !== otp) {
      return next(new CustomError("Invalid OTP", 400));
    }

    await OtpModel.deleteOne({ email });

    res.status(200).json({ message: "OTP verified successfully" });
  }
);
//google
export const googleAuth = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    console.log("controller in google auth...");
    console.log("Request body:", req.body);

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const { credential } = req.body;

    if (!credential) {
      console.log("No credential provided");
      res.status(400).json({ message: "Google credential is required" });
      return;
    }
    res.cookie("test", "hello", { httpOnly: false });

    try {
      console.log("Verifying id_token...");
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload?.email) {
        console.log("No email in payload");
        res.status(400).json({ message: "Invalid Google token payload" });
        return;
      }

      const { email, picture, name } = payload;
      console.log("Google fetched payload:", { email, name, picture });

      const user = await registerUserService({
        username: name || "Google User",
        email: email || "default@example.com",
        role: "user",
        password: "",
        picture: picture || "",
        sign: "google",
      });

      console.log("Google user created:", user);

      const userRole: "user" | "owner" | "admin" = user.role ?? "user";
      const userEmail: string = user.email ?? "default@example.com";
      const userUsername: string = user.username ?? "Google User";

      const tokenPayload: UserPayload = {
        _id: user.id,
        email: userEmail,
        role: userRole,
        picture: user.picture ?? "",
        username: userUsername,
      };

      const accessToken = generateToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);
      console.log(accessToken);
      console.log(refreshToken);

      res.cookie("role", "user", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        maxAge: 50 * 60 * 1000,
        path: "/",
        sameSite: "none",
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
        sameSite: "none",
      });

      res.status(201).json({
        message: "Google Auth successful",
        user,
      });
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(401).json({ message: "Invalid or expired Google token" });
    }
  }
);

export const updateUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    console.log("hi");

    const _id = "68301fd02868a7c0612bbbf7";
    const { username, password } = req.body;
    const file = req.file;

    console.log(file, "file ");
    const updateUser = await updateUserService(
      _id,
      { username, password },
      file
    );

    console.log(updateUser, " hh");

    res.status(200).json({
      message: "User update successfully",
    });
  }
);

export const LoginedUserDetails = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    // const userId ="68470dbc134bb9190212de1e"

    const userId = req.user?.userId
    console.log(userId);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const user = await getLoginedUserDetails(userId);
    console.log(user, "user");

    res.status(200).json({
      user
    })
  }
);
