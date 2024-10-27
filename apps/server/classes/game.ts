import { Server, Socket } from "socket.io"
import { generateParagraph } from "../utils/generateParagraph"
import { rooms } from "../setupListener"

export class Game{
    gameStatus:"not-started"|"in-progress"|"finished"
    gameId:string
    player:{id:string,score:number,name:string}[]
    io:Server
    gameHost:string;
    paragraph:string;
    constructor(roomid:string,io:Server,host:string){
        this.gameId=roomid;
        this.player=[]
        this.io=io
        this.gameHost=host
        this.gameStatus="not-started"
        this.paragraph=""
    }
    setuplisteners(socket:Socket){
        socket.on("start-game",async()=>{
            if(this.gameStatus==="in-progress") return socket.emit("error","Game has already started ,please wait for it to end")
            if(this.gameHost!==socket.id) return socket.emit("error","Only host can start the game")
            for(const player of this.player){
                player.score=0
            }
            this.io.to(this.gameId).emit("players",this.player)
            this.gameStatus="in-progress"
            const paragraph=await generateParagraph()
            this.paragraph=paragraph
            this.io.to(this.gameId).emit("game-started",paragraph)
            setTimeout(()=>{
                this.gameStatus="finished"
                this.io.to(this.gameId).emit("game-finished")
                this.io.to(this.gameId).emit("players",this.player)
            },60000)
        })
        socket.on("player-typed",(typed:string)=>{
            if(this.gameStatus!=="in-progress") 
                return socket.emit("error","Game has not started yet")
            const splittedParagraph=this.paragraph.split(" ")
            const splittedTyped=typed.split(" ")
            let score=0
            for(let i=0;i<splittedTyped.length;i++){
                if(splittedTyped[i]===splittedParagraph[i]){
                    score++
                }
                else{
                    break
                }
            }
            const player=this.player.find(player=>player.id===socket.id)
            if(player) player.score=score
            this.io.to(this.gameId).emit("player-score",{
                id:socket.id,
                score
            })
        })
        socket.on("disconnect",()=>{
            if(socket.id===this.gameHost){
                this.player=this.player.filter(player=>player.id!==socket.id)
                if(this.player.length>0){
                    this.gameHost=this.player[0].id
                    this.io.to(this.gameId).emit("new-host",this.gameHost)
                    this.io.to(this.gameId).emit("player-left",socket.id)
                }
                else{
                    rooms.delete(this.gameId)
                }
            }
            socket.leave(this.gameId)
            this.player=this.player.filter(player=>player.id!==socket.id)
            this.io.to(this.gameId).emit("player-left",socket.id)
        })
    }
    joinPlayer(id:string,name:string,socket:Socket){
        if(this.gameStatus==="in-progress") return socket.emit("error","Game has already started ,please wait for it to end") 
            this.player.push({id,name,score:0})
            this.io.to(this.gameId).emit("player-joined",{
                id,name,score:0
            })  
            socket.emit("player",this.player)
            socket.emit("new-host",this.gameHost)
            this.setuplisteners(socket) 
        }
}
