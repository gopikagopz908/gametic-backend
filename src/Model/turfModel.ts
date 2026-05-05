import mongoose, { Schema, Document } from "mongoose";
import { ratingSchema, Rating } from "./ratingModel";
import { bookingSchema, Booking } from "./bookingModel";

export interface TurffData extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  city: string;
  area: string;
  location: string;
  turfType:
    | "football"
    | "cricket"
    | "multi-sport"
    | "swimming"
    | "basketball"
    | "badminton"
    | "tennis"
    | "volleyball"
    | "hockey";
  size?: string;
  images: string[];
  availability: {
    [day: string]: { start: string; end: string }[];
  };
  bookedSlot: {
    date: string;
    slots: { start: string; end: string }[];
  }[];
  hourlyRate: number;
  status: "active" | "inactive";
  isDelete: boolean;
  ratings: Rating[];
  bookings: Booking[];
  averageRating?: number;
  isBlocked:boolean;
}

const turfSchema = new Schema<TurffData>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    turfType: {
      type: String,
      enum: [
        "football",
        "cricket",
        "multi-sport",
        "swimming",
        "basketball",
        "badminton",
        "tennis",
        "volleyball",
        "hockey",
      ],
      required: true,
    },
    size: {
      type: String,
    },
    images: {
      type: [String],
      required: true,
    },
    hourlyRate: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    availability: {
      type: Schema.Types.Mixed,
      required: true,
    },
    bookedSlot: [
      {
        date: {
          type: String,
          required: true,
        },
        slots: [
          {
            start: {
              type: String,
              required: true,
            },
            end: {
              type: String,
              required: true,
            },
          },
        ],
      },
    ],
    isDelete: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
  type: Boolean,
  default: false,
},
    ratings: [ratingSchema],
    bookings: [bookingSchema],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate average rating before saving
turfSchema.pre("save", function (next) {
  if (this.ratings && this.ratings.length > 0) {
    const sum = this.ratings.reduce(
      (total, rating) => total + rating.rating,
      0
    );
    this.averageRating = sum / this.ratings.length;
  } else {
    this.averageRating = 0;
  }
  next();
});

const Turff = mongoose.model<TurffData>("Turf", turfSchema);
export default Turff;
