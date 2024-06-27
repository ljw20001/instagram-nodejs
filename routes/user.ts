import { Response, NextFunction, Request, } from "express";
import pg from "pg";
import env from "dotenv";
import multer from "multer"; 
import path from 'path';
import { Router } from 'express';
import isLoggedIn from "../auth/isLogged.js"; 

env.config();
const router = Router();
const db = new pg.Client({
    user: process.env.RDS_USERNAME,
    host: process.env.RDS_HOSTNAME,
    database: process.env.RDS_DB_NAME,
    password: process.env.RDS_PASSWORD,
    port: Number(process.env.RDS_PORT),
  });
  
  db.connect();
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/profiles/');
    },
    filename: function (req, file, cb) {
      const name = file.originalname; 
      const after = name.split('.'); 
      cb(null, req.user!.email+"."+after[1]);
    },
  });
  const uploadprofile = multer({
      storage :  storage, 
      fileFilter: function (req:Express.Request,file: Express.Multer.File,callback:Function){
        var ext = path.extname(file.originalname);
        if(ext !==".png" && ext !== ".jpg" && ext!== ".jpeg"){
          return callback(new Error("png jpg만")); 
        }
        callback(null,true); 
      },
      limits: {
        fileSize: 1024*1024, 
      }, 
    })

  router.post("/uploadprofile", isLoggedIn,uploadprofile.single("profile"), async function(req, res){
  
  
    try {
      const result = await db.query("update users set profile = $1 where email=$2 ", [
        req.file!.filename, req.user!.email    
      ]);  
      console.log(req.file); 
    }catch(err){
      console.log(err); 
    } 
    res.redirect("/user/profile"); 
  
  })
  
  
  
  
  router.get("/private", isLoggedIn, async(req, res) => {
    
    const email = req.query.email; 
    const boolean = req.query.boolean; 
    try {  
      const result1 = await db.query("update users set private=$1 where email= $2 ", [
        boolean,email,       
      ]);  
      res.redirect("back") ; 
      }
    catch(err){
      console.log(err); 
    }
  
  }); 
  
  router.get("/profile", isLoggedIn, async(req, res) => {
    
      const useremail=req.user!.email; 
      try {
         
        const result1 = await db.query("SELECT * FROM users WHERE email = $1 ", [
          useremail,       
        ]);  
        const result2 = await db.query("SELECT * FROM post WHERE user_email = $1 ", [
          useremail,       
        ]);
        res.render("profile.ejs",{      
          user:result1.rows[0], 
          postlist: result2.rows,
        }); 
      }catch(err){
        console.log(err); 
      } 
  
  });
  
  
  
  
   
  
  
  
  router.post("/unfollow", isLoggedIn,async(req, res) => {
    const email = req.user!.email;
    const target = req.query.email; 
    
    try {
      const result = await db.query("update users set followin = array_remove(followin, $1) where email= $2 ", [
        target,email
      ]);    
    }catch(err){
      console.log(err); 
    }
    try {
      const result = await db.query("update users set follower = array_remove(follower, $1) where email= $2 ", [
        email,target
      ]);    
    }catch(err){
      console.log(err); 
    }
    res.redirect("/"); 
  
  });
  
  router.post("/follow", isLoggedIn,async(req, res) => {
    
    const email = req.user!.email;
    const target = req.query.email;
     
    try {
      const result = await db.query("update users set followin = array_append(followin, $1) where email= $2 ", [
        target,email
      ]);    
    }catch(err){
      console.log(err); 
    }
    try {
      const result = await db.query("update users set follower = array_append(follower, $1) where email= $2 ", [
        email,target
      ]);    
    }catch(err){
      console.log(err); 
    } 
    return res.redirect("/post?email="+target);
  
  });
  
  
  
  
  
  router.get("/block", isLoggedIn,async(req, res) => {
    
    const email = req.query.email;
    const user = req.user!; 
    try {
      const result = await db.query("update users set block = array_append(block, $1) where email= $2 ", [
        email,user.email
      ]);
      
    }catch(err){
      console.log(err);
    }
    res.redirect("back");
  
  });
  router.get("/unblock", isLoggedIn,async(req, res) => {
    
    const email = req.query.email;
    const user = req.user!; 
    try {
      const result = await db.query("update users set block = array_remove(block, $1) where email= $2 ", [
        email,user.email
      ]);
      
    }catch(err){
      console.log(err);
    }
    res.redirect("back");
  
  });  
export default router;