import mongoose,{Schema, Document} from "mongoose";

interface User extends Document {
    username: string;
    email: string;
    password:string;
    rooms:mongoose.Types.ObjectId[];
    lastReadMessage: Record<string, mongoose.Types.ObjectId>;
}

interface Room extends Document {
    name:string;
    creater_id:mongoose.Types.ObjectId;
    users:mongoose.Types.ObjectId[];
    messages:mongoose.Types.ObjectId[];
}

interface Messages extends Document {
    content:string;
    sender_name:string;
    room_id:mongoose.Types.ObjectId;
}

const userSchema:Schema<User> = new Schema({
    username:{
        type: String,
        required: [true,"Username is required"],
        unique: true,
        minlength: [3,"Username must be at least 3 characters long"],
        trim:true,
    },
    email:{
        type: String,
        required: [true,"Email is required"],
        unique: true,
        trim:true,
    },
    password:{
        type: String,
        required: [true,"Password is required"],
        minlength: [6,"Password is required"],
        trim:true,
    },
    rooms:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Room",
    }],
    lastReadMessage:{
        type:Map,
        of:mongoose.Schema.Types.ObjectId,
        default:{}
    }
});

const roomSchema:Schema<Room> = new Schema({
    name:{
        type:String,
        unique: true,
        required:[true,"Room name is required"],
    },
    creater_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:[true,"Room creator is required"],
    },
    users:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    }],
    messages:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Messages",
    }]
});

const messageSchema:Schema<Messages> = new Schema({
    content:{
        type:String,
        required:[true,"Message is required"],
    },
    sender_name:String,
    room_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Room"
    }
})

export const userModel = mongoose.model<User>("User", userSchema);
export const roomModel = mongoose.model<Room>("Room",roomSchema);
export const messageModel = mongoose.model<Messages>("Messages", messageSchema);