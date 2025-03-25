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

const contentTypes=['video','tweet']
const ContentSchema = new Schema({
    link: {type:String,required:true},
    type: {type:String,enum:contentTypes,required:true},
    title: {type:String, required:true},
    tags: [{type: mongoose.Types.ObjectId, ref:'tags'}],  
    userId:{type: mongoose.Types.ObjectId, ref:'users', required:true, validate: async function(value: mongoose.Types.ObjectId){
        const user= await UserModel.findById(value);
        if(!user){
            throw new Error('User does not exist')
        }
    }}
})

const ContentModel = model("content",ContentSchema)



const TagSchema = new Schema({
    title: {type:String, required:true, unique:true}
})

const TagModel = model("tags",TagSchema)


const LinkSchema = new Schema({
    hash: {type:String, unique:true},
    userId: {type: mongoose.Types.ObjectId, ref:'users', required:true, unique:true},
    share:{type:Boolean}
})

const LinkModel = model("links", LinkSchema) 


export{UserModel,connectToDatabase, ContentModel, TagModel, LinkModel}