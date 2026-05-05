import express from "express";
import {
  blockUser,
  deleteUser,
  deleteVenue,
  getAllBookings,
  getAllUsers,
  toggleBlockVenue,
} from "../Controller/adminController";
import { getAllVenues } from "../Controller/admin/venueController";
import { loginAdmin } from "../Controller/admin/authentication";
import { logOut } from "../Controller/userController";
const route = express.Router();

route

  .post("/login", loginAdmin)
  .post("/logout", logOut)
  //Handling Users
  .get("/users", getAllUsers)
  .patch("/block-user/:id", blockUser)
  .delete("/delete-user/:id", deleteUser)

  //Handling Venues
  .get("/venues", getAllVenues)
  .patch("/ban/:id",toggleBlockVenue)
  .delete("/delete-venu/:id",deleteVenue)
  // Handling Bookings
   .get("/bookings", getAllBookings)

export default route;
