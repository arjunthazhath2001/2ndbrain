require('dotenv').config()
import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import {connectToDatabase,ContentModel,LinkModel,TagModel,UserModel} from './db'
import {z} from 'zod'
import { Middleware } from './middleware'
import { hash } from 'crypto'
import Link from 'next/link'
const app= express()
app.use(express.json())

connectToDatabase()

app.post('/api/v1/signup', async function(req,res){
    const requiredBody= z.object({
        username: z.string().min(5).max(20,{message:"Username too big, should be less than 20 characters"}),
        password: z.string().min(5).max(15,{message:"Password too big, should be less than 15 characters"})
    })    
    try{
    const parsedBody= requiredBody.safeParse(req.body)
    if(!parsedBody.success){
        res.status(404).json(parsedBody.error.issues[0].message)
        return
    }

    const username = req.body.username;
    const password = req.body.password;
    const hashedPassword= await bcrypt.hash(password,5)
        
        const user= await UserModel.create({
        username: username,
        password: hashedPassword
    })
        if(user){
        res.status(201).json({message:"User signed up"})
    } else{
        res.status(401).json({message:"There is some problem. Try again later"})
    }


    } catch(error){
        res.status(500).json({message: "Couldnt make the entry, try a different username!"})
        return
    }    
    
})


app.post('/api/v1/signin', async function(req,res){
    const username = req.body.username;
    const password= req.body.password;

    try{
    const user= await UserModel.findOne({
        username:username
    })

    if(user){
        const verified= await bcrypt.compare(password,user.password as string)
        if(verified){
            const token = jwt.sign({id: user._id}, process.env.JWT_SECRET as string)
            res.status(200).json({"success":token})
        } else{
            res.status(401).json({message:"Wrong password"})
        }
    }else{
        res.status(404).json("No such user exists")
    }
    }catch(e){
        res.status(500).json("Please try again later")
        return
    }
})


app.post('/api/v1/content', Middleware, async function(req,res){
    const requiredBody= z.object({
        link: z.string().url({message:"This is not a url"}),
        type: z.enum(['image','video','article','audio'], {message:"You can only choose from image, video, article and audio"}),
        title: z.string().min(3,{message:"Too small of a title"}).max(100,{message:"Title should be less than 100 characters"}),
        tags: z.array(z.string(),{message:"Array of strings expected"})        
    })

    try{
    
    const parsedBody= requiredBody.safeParse(req.body)

    if(!parsedBody.success){
        res.json(parsedBody.error.issues[0].message)
        return
    }
    const link = req.body.link
    const type = req.body.type
    const title = req.body.title
    const tags = req.body.tags
    //@ts-ignore
    const userId = req.id;
    const tagIds= []

    //will check whether the tags are currently in our TagModel if its exists then it ll send that tag id will be pushed into the list of TAGIDS. Else it will create a tagmodel.create and then push it to TAGIDS before pushing it to the content model.
        for(let tag of tags){
            const lowertag= tag.toLowerCase()
            const dbtag= await TagModel.findOne({title:lowertag})

            if(dbtag){
                tagIds.push(dbtag._id)
            }
            else{
                const newtag = await TagModel.create({
                    title: lowertag
                })
                if(newtag){
                    tagIds.push(newtag._id)
                }        
            }

    }
    
        const content= await ContentModel.create({
        link :link,
        type:type,
        title:title,
        tags : tagIds,
        userId:userId
    })


    if(content){
        res.json({"message":"Content created successfully"})
    }
    }catch(error){
        res.status(404).json({"Could not add Content":error})
        return
    }
}
)



app.get('/api/v1/content', Middleware, async function(req,res){
    //@ts-ignore
    const userId= req.id
    try{
        const contents= await ContentModel.find({
        userId: userId
    }).populate("userId", "username").populate("tags","title")

    if(contents){
        res.json(contents)
    }
    else{res.json("no contents to show")}
    }
    catch(error){
        res.json("some error try again later")
}
})



app.delete('/api/v1/content', Middleware, async function(req,res){
    const objId= req.body.objId
      //@ts-ignore
    const userId = req.id
    try{

        const content = await ContentModel.deleteOne({
            _id: objId,
            userId: userId
        })
        if(content){
            res.json("content deleted successfully")
        }
        else{
            res.json("Couldnt delete content related with this content")
        }
    }
    catch(error){
        res.json("Some error has occured. Try again later")
    }
})


app.post('/api/v1/share', Middleware,async function(req,res){
    
    //@ts-ignore
    const userId=req.id
    
    const dblink= await LinkModel.findOne({
        userId: userId
    })

    if(dblink){        
        const shareableLink= `${req.protocol}://${req.hostname}/api/v1/brain/${dblink.hash}`
        res.json({'link': shareableLink})
        return
    }
    
    
    try{    
        const hashedId= await bcrypt.hash(userId,5)
        const shortHash= hashedId.replace(/[^a-zA-Z0-9]/g,'').substring(0,10)
        const link= await LinkModel.create({
            hash: shortHash,
            userId: userId,
            share: true
        })

        if(link){
            const shareableLink= `${req.protocol}://${req.hostname}/api/v1/brain/${link.hash}`
            res.status(200).json({'link':shareableLink})
        }else{
            res.json({"message":"Failed to create shareableLink"})
        }
        
        } catch(error){

            res.json('Some error has occured')

        }
})


app.patch('/api/v1/share', Middleware,async function(req,res){
    
    //@ts-ignore
    const userId=req.id
    try{
    const dblink= await LinkModel.findOne({
        userId: userId
    })
    if(dblink){
        const share = !(dblink.share)
        const link= await LinkModel.updateOne(
        {userId:userId},
        {share: share}
    )
    if(link){
        res.status(200).json({message:"Link status modified successfully", status:share})
        }
    } else{
        res.json("No link found")
    }
    }
    catch(error){
        res.status(400).json('Some error try again later')
    }

})


app.get('/api/v1/brain/:sharelink', async function(req,res){
    const hash= req.params.sharelink
    try{
        const user= await LinkModel.findOne({
        hash:hash
    })
    if(user && user.share){
        const userId= user.userId
        try{
            const contents= await ContentModel.find({
            userId: userId
        }).populate("userId", "username").populate("tags","title")

        if(contents){
            res.json(contents)
        }
        else{res.json("no contents to show")}
        }
        catch(error){
            res.json("some error try again later")
            return
    }
    }
    else{
        res.status(400).json("Sorry the link does not exist")
    }}catch(error){
        res.json("Some error try again later")
    }
})


app.listen(3000)