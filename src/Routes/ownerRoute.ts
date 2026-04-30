import express from 'express'
import { createTurf, deleteTurf, editTurf, getAllturf, turfById ,updateUserProfile ,updateBookingStatus} from '../Controller/ownerController'
import upload from '../Middleware/uploadMulter';
import { verifyOwner } from '../Middleware/auth';
const ownerRoute=express()


ownerRoute.post('/owner/addTurf',verifyOwner,upload.array('images',5),createTurf)
ownerRoute.patch('/owner/editTurf/:id',verifyOwner,upload.array('images',5),editTurf)
ownerRoute.get('/owner/getAllturf',getAllturf)
ownerRoute.delete('/owner/turfs/:id', verifyOwner,deleteTurf)
ownerRoute.get('/owner/getTurf/:id',verifyOwner,turfById)
ownerRoute.put("/users/:id",verifyOwner, updateUserProfile);
ownerRoute.put('/owner/update-booking-status/:id',verifyOwner, updateBookingStatus);



export default ownerRoute;