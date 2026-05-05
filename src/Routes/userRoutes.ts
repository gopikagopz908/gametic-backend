import express from "express";
import {
  loginUser,
  registerUser,
  verifyOtp,
  logOut,
  googleAuth,
  emailVerification,
  updateUser,
  LoginedUserDetails,
} from "../Controller/userController";
import {
  addPost,
  deletePost,
  getAllPost,
  getPostById,
  joinMatchPost,
} from "../Controller/matchPostController";
import { createTeam } from "../Controller/teamController";
import {
  createHostingOrder,
  createJoinOrder,
  getAllMatches,
  getMatchById,
  getVenueBySports,
  hostMatch,
  joinMatch,
  verifyJoinPayment,
} from "../Controller/user/matchHostController";
import { bookVenue, createBookingOrder, getAllVenuesforUser, getVenueByIdforUser } from "../Controller/user/venueController";
import upload from "../Middleware/uploadMulter";
import { authMiddleware } from "../Middleware/auth";
import { createTournamentPost, getAllTournamentPost } from "../Controller/tournamentController";

const router = express.Router();




router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/logout", logOut);

router.post("/emailverification", emailVerification);

router.post("/verifyotp", verifyOtp);

router.post("/auth/google", googleAuth);

router.post("/addMatch", addPost);
router.get("/getAllPost", authMiddleware, getAllPost);
router
  //Host
  .get("/all-matches", getAllMatches)
  .get("/match/:matchId", getMatchById)
  .post("/host-match", authMiddleware, hostMatch)
  .post("/join-match/:matchId", authMiddleware, joinMatch)
  .get("/turfby-sport", getVenueBySports)

  .post("/create-hosting-order", authMiddleware, createHostingOrder)
  .post("/create-join-order/:matchId", authMiddleware, createJoinOrder)
  .post("/verify-join-payment", authMiddleware, verifyJoinPayment)

  //venue booking
  .post("/venue-booking",authMiddleware, bookVenue)
  .post("/create-booking-order", authMiddleware, createBookingOrder)

  .get('/getAllVenues',getAllVenuesforUser)
  .get("/veunesById/:turfId", getVenueByIdforUser);

router.post("/addMatch", addPost);
router.get("/getAllPost", getAllPost);

router.get("/postById/:id", getPostById);

router.post("/postById/:id/join", joinMatchPost);

router.patch("/deletepost/:id", deletePost);
    

router.post("/createTournament",authMiddleware,upload.single("image"),createTournamentPost)
 
router.get("/getAllTournament",getAllTournamentPost)
router.post("/updateprofile", upload.single("picture"), updateUser);
                    

router.post("/check", loginUser);
router.get("/postById/:id", getPostById);

router.post("/postById/:id/join", joinMatchPost);

router.patch("/deletepost/:id", deletePost);
router.post("/updateprofile", upload.single("picture"), updateUser);

router.post("/team",authMiddleware, createTeam);

router.post("/me", authMiddleware ,LoginedUserDetails);

export default router;
