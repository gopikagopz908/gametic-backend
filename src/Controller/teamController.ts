import { Request, Response } from "express";
import User from "../Model/userModel";
import { createTeamService } from "../Service/teamService";
import { CustomError } from "../utils/customError";
import { asyncErrorhandler } from "../Middleware/asyncErrorHandler";
import { AuthenticatedRequest } from '../Middleware/auth';
import mongoose from "mongoose";
import {sendEmailService} from '../utils/sentInvitation'
                                    

export const createTeam = asyncErrorhandler(async (req: AuthenticatedRequest, res: Response) => {
  const { name, sport, memberEmails } = req.body;
 const { userId, role } = req.user!;

 console.log(req.user,"????????????")
  
const teamManager=new mongoose.Types.ObjectId(userId);


  // if (!teamManager) {
  //   throw new CustomError('Unauthorized: teamManager ID missing');
  // }

  if (!Array.isArray(memberEmails) || memberEmails.length === 0) {
    throw new CustomError('At least one member email is required');
  }

  // Fetch users by email (only _id and email fields)
const users = await User.find({ email: { $in: memberEmails } }, '_id email').exec();



const memberIds = users.map((u) => u._id);

  const team = await createTeamService(name, sport, memberIds, teamManager);



await sendEmailService(memberEmails);

  return res.status(201).json({
    message: 'Team created successfully',
    team,
    addedMembers: users.map((u) => ({ id: u._id, email: u.email })),
  });
});