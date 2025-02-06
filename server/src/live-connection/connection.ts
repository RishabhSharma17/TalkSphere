import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { roomModel, userModel, messageModel } from "@/database/db.model";
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

        socket.on('joinroom', async (roomId: string) => {
            try {
                const userId = new mongoose.Types.ObjectId(socket.userId ?? "");
                let room = await roomModel.findById(roomId).populate('messages');
                const user = await userModel.findById(userId);
    
                if (!room || !user) {
                    socket.emit('error', { message: "Room or User not found", success: false });
                    return;
                }
    
                // **Add user to room in the database (if not already a member)**
                if (!room.users.includes(userId)) {
                    room.users.push(userId);
                    await room.save();
                }
    
                // **Fix: Handle lastReadMessage as an object**
                user.lastReadMessage = user.lastReadMessage || {}; // Ensure it's defined
                user.lastReadMessage[roomId] = room.messages?.[room.messages.length - 1]?._id || null;
                await user.save();
    
                socket.join(roomId);
                socket.emit('room-joined', { message: "User joined the room", success: true });
    
                // **Fix: Handle undefined messages**
                const unreadCount = room.messages?.filter(msg => msg._id > (user.lastReadMessage[roomId] || "")).length || 0;
    
                socket.emit('unread-messages', { roomId, unreadCount });
    
            } catch (error) {
                console.log(error);
                socket.emit('error', { message: "Internal server error", success: false });
            }
        });
        
        

        socket.on('send-message',async (content:string,roomId:string) => {
            try {
                
                const userId = new mongoose.Types.ObjectId(socket.userId);
                const room_id = new mongoose.Types.ObjectId(roomId);

                const existroom = await roomModel.findById(room_id);
                const existuser = await userModel.findById(userId);
                if(!existroom || !existuser){
                    socket.emit('error',{
                        message:"Room or User not found",
                        success:false,
                    })
                    return;
                }

                const message = new messageModel({
                    content,
                    sender_name:existuser.username,
                    room_id:existroom._id as mongoose.Types.ObjectId,
                });
                
                await message.save();

                existroom.messages.push(message._id as mongoose.Types.ObjectId);
                await existroom.save();
                   
                io?.to(roomId).emit('new-message',{
                    message:content,
                    sender_name:existuser.username,
                });
            } catch (error) {
                console.log(error);
                socket.emit('error',{
                    message:"Internal server error",
                    success:false,
                });
                return;
            }
        });

    })
    
}