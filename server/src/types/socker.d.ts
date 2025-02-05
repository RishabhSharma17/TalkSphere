import { Socket } from "socket.io";

declare module "socket.io" {
    interface Socket {
        request:{
            cookies:Record<string,string>;
        },
        userId?:string;
    }
}