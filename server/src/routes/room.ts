import express, { Request, Response, Router } from 'express';
import authcheck from '../middleware/authCheck';
import { roomCreateSchema } from '../Schemas/roomSchema';
import { roomModel, userModel } from '../database/db.model';
import mongoose, { Types } from 'mongoose';

const roomRouter:Router = express.Router();

roomRouter.post('/create',authcheck,async (req:Request,res:Response):Promise<void> => {
    const body = req.body;
    const validation = roomCreateSchema.safeParse(body);
    if(!validation.success){
        res.status(411).json({
            success:false,
            error: validation.error.message,
            message:"Invalid Inputs!"
        });
        return;
    }
    try {
        //@ts-ignore
        const userId = new mongoose.Types.ObjectId(req.user_id ?? "");
        const existroom = await roomModel.findOne({
            name:body.name,
        });

        if(existroom){
            res.status(409).json({    
                message:"name has already taken",
                success:false,
            });
            return;
        }

        const existuser = await userModel.findById(userId);

        if(!existuser){
            res.status(404).json({
                message:"User not found",
                success:false,
            });
            return;
        }

        const room = new roomModel({
            name:body.name,
            creater_id:userId,
        });

        room.users.push(userId);
        existuser.rooms.push(room._id as mongoose.Types.ObjectId);
        await room.save();
        await existuser.save();
        res.status(200).json({
            message:"Room created successfully",
            success:true,
            roomId:room._id
        });
        return;
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message:"Internal server error",
            success:false,
        });
        return;
    }
});


roomRouter.post('/joinroom/:roomId',authcheck,async (req:Request, res:Response):Promise<void> => {
    const { roomId } = req.params;
    //@ts-ignore
    const userId = new mongoose.Types.ObjectId(req.user_id ?? "");
    try {
        const user = await userModel.findById(userId);
        if(!user){
            res.status(404).json({
                message:"User not found",
                success:false,
            });
            return;
        }
        const room = await roomModel.findById(roomId);
        if(!room){
            res.status(404).json({
                message:"Room not found",
                success:false,
            });
            return;
        }

        room.users.push(user._id as mongoose.Types.ObjectId);
        user.rooms.push(room._id as mongoose.Types.ObjectId);
        await room.save();
        await user.save();
        res.status(200).json({
            message:"Joined room successfully",
            success:true,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message:"Internal server error",
            success:false,
        });
        return;   
    }
});

roomRouter.get("/all-info/:roomId",authcheck,async (req:Request, res:Response):Promise<void> => {
    const { roomId } = req.params;
    try {
        const existroom = await roomModel
        .findById(roomId)
        .populate({
            path:"users",
            select:"username",
        })
        .populate({
            path:"messages",
            select:"content sender_name",
        });

        if(!existroom){
            res.status(404).json({
                message:"Room not found",
                success:false,
            });
            return;
        }

        res.status(200).json({
            message:"Room found",
            success:true,
            room:{
                name:existroom.name,
                users:existroom.users,
                messages:existroom.messages,
            }  
        })
        return;
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message:"Internal server error",
            success:false,
        });
        return;
    }
})

export default roomRouter;