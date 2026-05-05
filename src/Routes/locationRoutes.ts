import express from 'express';
import { getAllLocations } from '../Controller/locationController';


const router = express.Router();

router.get('/locations', getAllLocations);

export default router;