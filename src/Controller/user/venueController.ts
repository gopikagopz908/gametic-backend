import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Turff, { TurffData } from "../../Model/turfModel";
import { asyncErrorhandler } from "../../Middleware/asyncErrorHandler";
import { Booking } from "../../Model/bookingModel";
import Razorpay from "razorpay";
interface BookVenueRequestBody {
  turfId: string;
  date: string;
  startTime: string;
  endTime: string;
}
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string | undefined;
  };
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

const isSlotBooked = (
  turf: TurffData,
  date: string,
  startTime: string,
  endTime: string
): boolean => {
  const bookedSlots = turf.bookedSlot.find((slot) => slot.date === date);
  if (!bookedSlots) return false;

  const requestedStart = new Date(`1970-01-01T${startTime}:00`);
  const requestedEnd = new Date(`1970-01-01T${endTime}:00`);

  return bookedSlots.slots.some((slot) => {
    const slotStart = new Date(`1970-01-01T${slot.start}:00`);
    const slotEnd = new Date(`1970-01-01T${slot.end}:00`);
    return (
      (requestedStart >= slotStart && requestedStart < slotEnd) ||
      (requestedEnd > slotStart && requestedEnd <= slotEnd) ||
      (requestedStart <= slotStart && requestedEnd >= slotEnd)
    );
  });
};

export const bookVenue = asyncErrorhandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { turfId, date, startTime, endTime } =
      req.body as BookVenueRequestBody;

    if (!turfId || !date || !startTime || !endTime) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(turfId)) {
      res.status(400).json({ message: "Invalid turf ID" });
      return;
    }

    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      res.status(400).json({ message: "Invalid time format. Use HH:MM" });
      return;
    }

    if (isNaN(Date.parse(date))) {
      res.status(400).json({ message: "Invalid date format" });
      return;
    }

    const turf = await Turff.findOne({
      _id: turfId,
      status: "active",
      isDelete: false,
    });
    if (!turf) {
      res.status(404).json({ message: "Turf not found or inactive" });
      return;
    }

    if (isSlotBooked(turf, date, startTime, endTime)) {
      res.status(400).json({ message: "Requested slot is already booked" });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const amount = turf.hourlyRate;

    // Create new booking
    const newBooking: Booking = {
      turfId: turf._id,  // ✅ ADD THIS

      userId: new mongoose.Types.ObjectId(userId),
      date: new Date(date),
      startTime,
      endTime,
      status: "pending",
      paymentStatus: "pending",
      amount,
      createdAt: new Date(),
      bookingType: "normal",
    } as Booking;

    turf.bookings.push(newBooking);

    const bookedSlotIndex = turf.bookedSlot.findIndex(
      (slot) => slot.date === date
    );
    if (bookedSlotIndex >= 0) {
      turf.bookedSlot[bookedSlotIndex].slots.push({
        start: startTime,
        end: endTime,
      });
    } else {
      turf.bookedSlot.push({
        date,
        slots: [{ start: startTime, end: endTime }],
      });
    }

    await turf.save();

    res
      .status(201)
      .json({ message: "Venue booked successfully", booking: newBooking });
  }
);

export const getVenue = asyncErrorhandler(async (req, res) => {
  const turf = await Turff.find({ location: "Alappuzha" });
  console.log(turf);

  res.status(200).json({ data: turf });
});

export const getAllVenuesforUser = asyncErrorhandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string | undefined;
    const turfType = req.query.type as string | undefined;

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(400).json({ message: "Invalid pagination parameters" });
    }

    const query: Partial<{
      $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
      turfType: string;
      isDelete: boolean;
    }> = { isDelete: false };

    if (turfType) {
      query.turfType = turfType;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { turfType: { $regex: search, $options: "i" } },
      ];
    }

    const totalVenues = await Turff.countDocuments(query);
    const totalActiveVenues = await Turff.countDocuments({
      ...query,
    });

    const venues = await Turff.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      message: "All Venues fetched successfully",
      venues,
      totalVenues,
      totalActiveVenues,
    });
  }
);

export const getVenueByIdforUser = asyncErrorhandler(
  async (req: Request, res: Response) => {
    const { turfId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(turfId)) {
      res.status(400).json({ success: false, message: "Invalid turf ID" });
      return;
    }

    const turf = await Turff.findById(turfId)
      .populate("ownerId", "name email")
      .populate("ratings")
      .populate("bookings")
      .select("-isDelete");

    if (!turf || turf.isDelete) {
      res.status(404).json({ success: false, message: "Turf not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: turf,
      message: "Turf retrieved successfully",
    });
  }
);

export const createBookingOrder = asyncErrorhandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { turfId, date, startTime, endTime } =
      req.body as BookVenueRequestBody;

    // Validation
    if (!turfId || !date || !startTime || !endTime) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(turfId)) {
      res.status(400).json({ message: "Invalid turf ID" });
      return;
    }

    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      res.status(400).json({ message: "Invalid time format. Use HH:MM" });
      return;
    }

    if (isNaN(Date.parse(date))) {
      res.status(400).json({ message: "Invalid date format" });
      return;
    }

    const turf = await Turff.findOne({
      _id: turfId,
      status: "active",
      isDelete: false,
    });
    if (!turf) {
      res.status(404).json({ message: "Turf not found or inactive" });
      return;
    }

    if (isSlotBooked(turf, date, startTime, endTime)) {
      res.status(400).json({ message: "Requested slot is already booked" });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const amount = turf.hourlyRate;

    // Create Razorpay order
    try {
      const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency: "INR",
        receipt: `booking_${Date.now()}`,
        notes: {
          userId,
          turfId,
          date,
          startTime,
          endTime,
          amount: amount.toString(),
          type: "booking",
        },
      };

      const order = await razorpay.orders.create(options);

      res.status(200).json({
        success: true,
        order,
        amount,
        currency: "INR",
        key_id: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ message: "Failed to create payment order" });
    }
  }
);