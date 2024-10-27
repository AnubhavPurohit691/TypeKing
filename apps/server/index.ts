import { createServer } from "http"
import { Server } from "socket.io"
import { setuplistener } from "./setupListener"

const PORT=process.env.PORT||8080
const httpServer=createServer()

const io=new Server(httpServer,{
    cors:{
        origin:"*",
        methods:["GET","POST"]
    },
})
setuplistener(io)

httpServer.listen(PORT,()=>console.log("server is running on port"+PORT))