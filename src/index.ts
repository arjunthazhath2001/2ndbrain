import express from 'express'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import {connectToDatabase,UserModel} from './db'
import {z} from 'zod'
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

})
app.post('/api/v1/content', async function(req,res){

})
app.get('/api/v1/content ', function(req,res){

})
app.delete('/api/v1/content', function(req,res){

})

app.post('/api/v1/share', function(req,res){

})

app.get('/api/v1/brain/:sharelink', function(req,res){

})


app.listen(3000)