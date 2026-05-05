import { Request, Response } from "express";
import { asyncErrorhandler } from "../Middleware/asyncErrorHandler";
import User from "../Model/userModel";
import { deleteUserService, toggleBlockUser } from "../Service/adminServices";
import { Booking } from "../Model/bookingModel";
import Turff from "../Model/turfModel";


export const getAllUsers = asyncErrorhandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string | undefined;
    const role = req.query.role as string | undefined;

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(400).json({ message: "Invalid pagination parameters" });
    }

    const query: Partial<{
      $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
      role: string;
      isBlocked: boolean;
    }> = {};

    if (role) {
      const validRoles = ["user", "owner"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          message: "Invalid role parameter. Must be 'user' or 'owner'",
        });
      }
      query.role = role;
    }

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const totalUsers = await User.countDocuments(query);
    const totalActiveUser = await User.countDocuments({
      ...query,
      isBlocked: false,
    });
    const totalBannedUsers = await User.countDocuments({
      ...query,
      isBlocked: true,
    });
    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      message: "All users fetched successfully",
      users,
      totalUsers,
      totalBannedUsers,
      totalActiveUser,
    });
  }
);

export const blockUser = asyncErrorhandler(
  async (req: Request, res: Response) => {
    const userId = req.params.id;
    const updatedUser = await toggleBlockUser(userId);

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: `User ${
        updatedUser.isBlocked ? "blocked" : "unblocked"
      } successfully`,
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        isBlocked: updatedUser.isBlocked,
      },
    });
  }
);

export const deleteUser = asyncErrorhandler(
  async (req: Request, res: Response) => {
    const userId = req.params.id;
    const deletedUser = await deleteUserService(userId);

    if (!deletedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ message: "User deleted successfully" });
  }
);


export const getAllBookings = asyncErrorhandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        message: "Invalid pagination parameters",
      });
    }

    const totalBookings = await Booking.countDocuments();

    const bookings = await Booking.find()
      .populate("userId", "username email phone")
      .populate("ownerId", "username email")
      .populate("turfId", "name location city")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      message: "All bookings fetched successfully",
      totalBookings,
      currentPage: page,
      totalPages: Math.ceil(totalBookings / limit),
      bookings,
    });
  }
);


// 🔥 Ban / Unban Venue
export const toggleBlockVenue = asyncErrorhandler(
  async (req: Request, res: Response) => {
    const venueId = req.params.id;

    const venue = await Turff.findById(venueId);

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    // ✅ Toggle the document field (not the model)
    venue.isBlocked = !venue.isBlocked;

    await venue.save();

    res.status(200).json({
      message: `Venue ${
        venue.isBlocked ? "banned" : "unbanned"
      } successfully`,
      venue: {
        id: venue._id,
        name: venue.name,
        isBlocked: venue.isBlocked,
      },
    });
  }
);


export const deleteVenue = asyncErrorhandler(
  async (req: Request, res: Response) => {
    const venueId = req.params.id;

    const deletedVenue = await Turff.findByIdAndDelete(venueId);

    if (!deletedVenue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    res.status(200).json({
      message: "Venue permanently deleted",
    });
  }
);