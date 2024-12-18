import { error } from "console";
import mongoose from "mongoose";
type ConnectionObject= {
    isConnected?: Number
}

const connection: ConnectionObject={}

async function dbConnect(): Promise<void> {
    if(connection.isConnected){
        console.log("Already connected to another db")
        return;
    }
    try{
        const db= await mongoose.connect(process.env.MONGO_URI || '')
        connection.isConnected= db.connections[0].readyState
        console.log("db connected sucessfully")
    }
    catch{
       console.log("db connection failed", error)
       process.exit(1)

    }
}

export default dbConnect

