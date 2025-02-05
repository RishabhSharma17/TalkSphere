import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { roomModel, userModel } from "@/database/db.model";
import mongoose from "mongoose";

let io : Server | null = null;

export const initializeSocketIO = (server : HttpServer) => {
    io = new Server(server,{
        cors:{
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.use(async (socket, next) => {
        //@ts-ignore
        const user_id = socket.request.cookies.userId as string;
        const userId = new mongoose.Types.ObjectId(user_id ?? "");

        if(!userId){
            return next(new Error('Not authenticated'));
        }

        const user = await userModel.findById(userId);

        if(!user){
            return next(new Error('User not found'));
        }

        socket.userId=user_id as string;
        next();
    });

    io.on('connection',(socket)=>{
        console.log(`user ${socket.userId} connected`);

        socket.on('joinroom',async (roomId:string) => {
            try {
                const userId = new mongoose.Types.ObjectId(socket.userId);
                const room_id = new mongoose.Types.ObjectId(roomId);
                const existroom = await roomModel.findById(room_id);
                const existuser = await userModel.findById(userId);
                if(!existroom){
                    socket.emit('error',{
                        message:"Room not found",
                        success:false,
                    })
                    return;
                }

                if(!existuser){
                    socket.emit('error',{
                        message:"User not found",
                        success:false,
                    })
                    return;
                }
                existuser.rooms.push(existroom._id as mongoose.Types.ObjectId);
                existroom.users.push(existuser._id as mongoose.Types.ObjectId);

                await existroom.save();
                await existuser.save();

                if(!existroom.users.includes(userId)){
                    socket.emit('error',{
                        message:"User has not joined the room",
                        success:false,
                    })
                }

                socket.join(roomId);

                socket.emit('room-joined',{
                    message:"User joined the room",
                    success:true
                });

                io?.to(roomId).emit(`${existuser.username} joined the ${existroom.name}`);

            } catch (error) {
             console.log(error);
             socket.emit('error',{
                 message:"Internal server error",
                 success:false,
             });   
            }
        });

        socket.on('send-message',async (content,roomId) => {

        })

    })
    
}