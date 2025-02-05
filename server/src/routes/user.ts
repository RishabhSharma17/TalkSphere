import { Router } from "express";
import express,{Request,Response} from 'express';
import { signinSchema, signupSchema } from "../Schemas/userSchema";
import { userModel } from "../database/db.model";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authcheck from "../middleware/authCheck";
import mongoose from "mongoose";

const userRouter:Router = express.Router();

userRouter.post('/signup',async (req:Request,res:Response):Promise<void>=>{
    const body = req.body;
    const validation = signupSchema.safeParse(body);
    if(!validation.success){
        res.status(411).json({
            success:false,
            message:"Invalid Credentials",
            reason:validation.error,
        })
        return;
    }

    try {
        
        const existuser = await userModel.findOne({
            "$or":[
                {username:body.username},
                {email:body.email}
            ]
        });

        if(existuser){
            res.status(400).json({
                message:"User already exist either with same email or username",
                success:false,
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(body.password,10);
        const user = new userModel({
            username:body.username,
            email:body.email,
            password:hashedPassword,
        });

        const jwt_secret : string = process.env.JWT_SECRET || "";
        const token = jwt.sign({username:user.username,userId:user._id},jwt_secret,{expiresIn:"24h"});

        await user.save();
        res.cookie("authToken",token,{
            httpOnly:true,
            sameSite:"lax"
        })
        res.status(200).json({
            success:true,
            message:"User created successfully",
        })
        return;

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Internal Server Error",
        });
        return;
    }
});

userRouter.post('/signin',async (req:Request,res:Response):Promise<void> => {
    const body = req.body;
    const validation = signinSchema.safeParse(body);
    if(!validation.success){
        res.status(411).json({
            success:false,
            message:"Invalid Credentials",
            reason:validation.error,
        })
        return;
    }
    try {
        
        const user = await userModel.findOne({
            "$or":[
                {username:body.identifier},
                {email:body.identifier}
            ]
        });

        if(!user){
            res.status(401).json({
                success:false,
                message:"User not found",
            });
            return;
        }

        const isPasswordValid = await bcrypt.compare(body.password,user.password);
        if(!isPasswordValid){
            res.status(401).json({
                success:false,
                message:"Invalid Password",
            });
            return;
        }

        const jwt_secret : string = process.env.JWT_SECRET || "";

        const token = jwt.sign({username:user.username,userId:user._id},jwt_secret,{expiresIn:"24h"});
        res.cookie("authToken",token,{
            httpOnly:true,
            sameSite:"lax"
        });

        res.status(200).json({
            success:true,
            message:"User signed"
        })
        return;

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Internal Server Error",
        });
        return;
    }
});

userRouter.get('/all-info',authcheck,async (req:Request,res:Response):Promise<void> => {
    //@ts-ignore
    const user_id = new mongoose.Types.ObjectId(req.user_id);
    try {
        const existuser = await userModel.findById(user_id).populate({
            path:"rooms",
            select:"name _id",
        });
        if(!existuser){
            res.status(404).json({
                success:false,
                message:"User not found",
            });
            return;
        }

        res.status(200).json({
            success:true,
            user:{
                username:existuser.username,
                email:existuser.email,
                rooms:existuser.rooms,
            }
        });
        return;
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Internal Server Error",
        });
        return;
    }
});

export default userRouter;