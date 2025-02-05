import { Request,Response,NextFunction } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';

export default async function authcheck(req: Request, res: Response,next:NextFunction):Promise<void>{
    const token = req.cookies.authToken;
    if(!token){
        res.status(401).json({error: 'Not authorized!'});
        return;
    }
    const secret:string = process.env.JWT_SECRET || "";
    try {
        const decoded = jwt.verify(token,secret);
        const decodeduser = decoded as JwtPayload & {userId:string};
        if(decodeduser){
            //@ts-ignore
            req.user_id = decodeduser.userId;
            next();
        }
        else{
            res.status(401).json({
                message:"Invalid token",
            });
            return;
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({
            message:"Invalid token",
        });
        return;
    }
}