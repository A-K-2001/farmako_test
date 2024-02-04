import express from 'express';
import { MongoClient, ObjectId } from "mongodb"
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'


const app = express();
app.use(express.json());
dotenv.config()

let db

MongoClient.connect('mongodb://localhost:27017/farmako')
    .then((client) => {
        db = client.db()
        app.listen(process.env.PORT, () => {
            console.log("Running at port :", process.env.PORT);
        })
    })
    .catch(err => {
        console.log(err)
    })



function verifyToken(req,res,next){
    const token = req.headers['authorization']
    // console.log(token)
    if(typeof token !== 'undefined'){
        jwt.verify(token,process.env.JWT_SCRT,(err,authData)=>{
            if(err){
                res.status(403).json({err:'forbidden'})
            }else{
                next()
            }
        })
}}


app.get('/user',verifyToken, (req, res) => {
    let users = []
    db.collection('user')
        .find()              //c
        .forEach(user => users.push(user))
        .then(() => {
            res.status(200).json(users)
        })
        .catch(() => {
            res.status(500).json({ error: 'data not fount' })
        })
})

app.get('/user/:id',verifyToken,(req,res)=>{
    if(ObjectId.isValid(req.params.id)){
        db.collection('user')
            .findOne({_id:new ObjectId(req.params.id)})
            .then(user=>{
                res.status(200).json(user)
            })
            .catch(err=>{
                res.status(500).json({err:"not found"})
            })

    }else{
        res.status(500).json({error:'not valid id'})
    }
   
})

app.post('/user',verifyToken,(req,res)=>{
    const user = req.body
    // console.log(user)
    if(user.email && user.username ){
        db.collection('user')
            .insertOne(user)
            .then(result =>{
                res.status(200).json(result)
            })
            .catch(err=> res.status(500).json({err:'err in save document'}))
    }else{
        res.status(501).json({err:'add username and email'})
    }
})

app.delete('/user/:id',verifyToken,(req,res)=>{
    if(ObjectId.isValid(req.params.id)){
        db.collection('user')
            .deleteOne({_id:new ObjectId(req.params.id)})
            .then(user=>{
                res.status(200).json(user)
            })
            .catch(err=>{
                res.status(500).json({err:"not deleted found"})
            })

    }else{
        res.status(500).json({error:'not valid id'})
    }
})
app.patch('/user/:id',verifyToken,(req,res)=>{
    const newUser = req.body
    if(ObjectId.isValid(req.params.id)){
        db.collection('user')
            .updateOne({_id:new ObjectId(req.params.id)},{$set : newUser})
            .then(user=>{
                res.status(200).json(user)
            })
            .catch(err=>{
                res.status(500).json({err:"not updated found"})
            })

    }else{
        res.status(500).json({error:'not valid id'})
    }
})


app.post('/login',(req,res)=>{
    const user = req.body
    if(user.username ){
        db.collection('user')
            .findOne({username:user.username})
            .then((result) =>{
                jwt.sign({usernaem:result.user,role:result.role},process.env.JWT_SCRT,{expiresIn: 3000},(err,token)=>{
                    res.status(201).json({token})
                })
            })
            .catch(err=> res.status(500).json({err:'err in login'}))
    }else{
        res.status(501).json({err:'add username'})
    }
})
