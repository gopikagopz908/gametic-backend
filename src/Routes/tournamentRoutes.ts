import express from "express";

import upload from "../Middleware/uploadMulter";
import { createTournamentPost, getAllTournamentPost, joinTeamToTournament, tournamentById } from "../Controller/tournamentController";


const tournamentRouter = express.Router();

// CREATE TOURNAMENT
tournamentRouter.post(
  "/",
             // remove if not needed
  upload.single("image"),  // required because you use req.file
  createTournamentPost
);

// GET ALL TOURNAMENTS
tournamentRouter.get("/", getAllTournamentPost);

// GET TOURNAMENT BY ID
tournamentRouter.get("/:id", tournamentById);

// JOIN TEAM TO TOURNAMENT
tournamentRouter.patch("/:id/join-team", joinTeamToTournament);

export default tournamentRouter;