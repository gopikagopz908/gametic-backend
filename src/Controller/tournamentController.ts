import { Request, Response } from "express";
import { asyncErrorhandler } from "../Middleware/asyncErrorHandler";
import { CustomError } from "../utils/customError";
import tournamentService from "../Service/tournamentService";
import mongoose from "mongoose";
import Tournament from "../Model/tournamentModel";
import { AuthenticatedRequest } from "../Middleware/auth";





export const createTournamentPost = asyncErrorhandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    description,
    sport,
    location,
    dateFrom,
    dateTo,
    maxTeams,
    entryFee,
    joinedTeams,
    prizePool,
    image
  } = req.body;

console.log(req.user,"userrrrr")

  const { userId } = req.user!;

  const file = req.file;

  if (!file) {
    throw new CustomError("Image file is missing", 400);
  }

  let parsedJoinedTeams: mongoose.Types.ObjectId[] = [];

  if (joinedTeams) {
    let raw: string[] = [];

    if (typeof joinedTeams === "string") {
      try {
        const parsed = JSON.parse(joinedTeams);
        if (Array.isArray(parsed)) {
          raw = parsed;
        } else if (typeof parsed === "string") {
          raw = parsed.split(",").map((id) => id.trim());
        } else {
          raw = [parsed];
        }
      } catch {
        raw = joinedTeams.split(",").map((id) => id.trim());
      }
    } else if (Array.isArray(joinedTeams)) {
      raw = joinedTeams;
    } else {
      raw = [joinedTeams];
    }

    parsedJoinedTeams = raw.map((id) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new CustomError(`Invalid Team ID: ${id}`, 400);
      }
      return new mongoose.Types.ObjectId(id);
    });
  }

  const tournamentData = {
    title,
    description,
    sport,
    location,
    dateFrom: new Date(dateFrom),
    dateTo: new Date(dateTo),
    maxTeams: Number(maxTeams),
    entryFee: Number(entryFee),
    prizePool: Number(prizePool),
    joinedTeams: parsedJoinedTeams,
    teamManager: new mongoose.Types.ObjectId(userId),
    image: file.path || file.filename,
  };

  const post = await tournamentService(tournamentData);

  return res.status(201).json({
    message: "Tournament created successfully",
    post,
  });
});

export const getAllTournamentPost=asyncErrorhandler(async(req:Request,res:Response)=>{

    const post=await Tournament.find()
    return res.status(200).json({
        message:"All TournamnetPOst successfully fetched",
        post
    })
})



export const tournamentById=asyncErrorhandler(async(req:Request,res:Response)=>{
  const{id}=req.params;
  if(!id){
    throw new CustomError("id is not available",404)
  }
  const data=await  Tournament.findById(id)
    .populate({
      path:'joinedTeams',
      populate:{
        path:'teamManager',
        select:' username email'
      }
    })

  return res.status(200).json({
    message:"Tournament post Fetched successfully",
    data
  })
})



export const joinTeamToTournament=asyncErrorhandler(async(req:Request,res:Response)=>{
  const{id}=req.params;
  const{teamId}=req.body;

  if(!teamId){
    throw new CustomError("invalid Team id",404)
  }
  const tournament=await Tournament.findById(id)
  if(!tournament){
    throw new CustomError('Tournament not found')
  }
  if(tournament.joinedTeams.includes(teamId)){
    throw new CustomError('Team already joined',400)
  }

   await Tournament.updateOne(
    { _id: id },
    { $push: { joinedTeams: teamId } }
  );

  return res.status(200).json({
    message: "Team added to Tournament"
  });
});