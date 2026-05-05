
import { Request, Response } from 'express';
import { Locations } from '../Model/locationModel';


export const getAllLocations = async (req: Request, res: Response) => {
  try {
    // const locations = await Locations.find({ isActive: true }).sort({ name: 1 }); 
     const locations = await Locations.find({ isActive: true }).select('name state').sort({ name: 1 }); ;
    res.status(200).json(locations);
  } catch (error) {
    // console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Failed to fetch locations' });
  }
};