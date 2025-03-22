require('dotenv').config()
import mongoose from "mongoose";
import {Schema,model} from "mongoose";

const dbUrl:string = process.env.MONGO_URL as string;


const connectToDatabase = async () => {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to the db");
    } catch (err) {
        console.error("Failed to connect to the db", err);
    }
};

const UserSchema = new Schema(
    {
        username: {type:String, unique:true},
        password: String
    }
)

const UserModel = model("users",UserSchema,)


export{UserModel,connectToDatabase}