import { configDotenv } from "dotenv";
configDotenv();
import express,{ Express } from "express";
import http from 'http';
import userRouter from "./routes/user";
import { dbConnect } from "./lib/dbConnect";
import cookieParser from "cookie-parser";
import cors from 'cors';
import roomRouter from "./routes/room";

const port : string = process.env.PORT  || "5000";
const app : Express = express();
app.use(cookieParser());
app.use(express.json());
dbConnect();
app.use(cors({
    credentials:true,
    origin:"*",
    methods:['GET', 'POST', 'PUT', 'DELETE']
}));
export const server  = http.createServer(app);


app.use('/app/v1/user',userRouter);
app.use('/app/v1/room',roomRouter);

server.listen(port,()=>{
    console.log(`Server started at http://localhost:${port}`);
})