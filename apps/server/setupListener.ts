import { Server } from "socket.io";
import { Game } from "./classes/game";

export const rooms=new Map<string,Game>()
export function setuplistener(io:Server){
io.on("connection",(socket)=>{
    console.log(`New connection - ${socket.id}`)
    socket.on("join-game",(roomId:string,name:string)=>{
     if(!roomId){
     return socket.emit("error","Invalid room Id")
     }
    if(!name){
     return socket.emit("error","please provide name")
     }
        socket.join(roomId)
       if(rooms.has(roomId)){
        const game = rooms.get(roomId)
        if(!game)return socket.emit("error","game not found")//this should not happen
        game.joinPlayer(socket.id,name,socket)
       }
       else{
        const game= new Game(roomId,io,socket.id)
        rooms.set(roomId,game)
        game.joinPlayer(socket.id,name,socket)
       }  
    })
})
}