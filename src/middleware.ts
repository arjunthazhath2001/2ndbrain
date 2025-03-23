import { Request,Response, NextFunction} from 'express'
import jwt from 'jsonwebtoken'

function Middleware(req:Request,res:Response,next:NextFunction){
    const token= req.headers.token
    
    try{
    const verifiedToken = jwt.verify(token as string,process.env.JWT_SECRET as string)

    if(verifiedToken){
        //@ts-ignore
        req.id = verifiedToken.id 
        next()
    }
    else{
        res.json("Please login again")
    }
    } catch(error){
        res.json("Please login again")
        return
    }

}

export {Middleware}