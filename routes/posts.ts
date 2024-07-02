
import pg from "pg";
import env from "dotenv";
import multer from "multer"; 
import { Router } from 'express';
import isLoggedIn from "../auth/isLogged.js"; 
import path from 'path';

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
      cb(null, 'public/posts/');
    },
    filename: function (req, file, cb) {
      const name = Math.random().toString(36).substring(2,11);  
      cb(null, new Date().valueOf() + name);
    }, 
  });
  const uploadpost = multer({
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
  
  router.post("/uploadpost", isLoggedIn,uploadpost.single("post"), async function(req, res){
  
    try {  
      const result1 = await db.query("INSERT INTO post (user_email, contents) VALUES ($1, $2) RETURNING *", [
        req.user!.email, req.file!.filename,     
      ]);
       
    }catch(err){
      console.log(err); 
    } 
    res.redirect("/user/profile"); 
  
  });
  router.get("/recomment", isLoggedIn,async(req, res) => {
  
    const commentid = req.query.commentid;
    const user = req.user; 
    try {  
      const result1 = await db.query("SELECT * FROM recommen WHERE comment_id = $1 ", [
        commentid,       
      ]);  
      res.render("recomment.ejs",{      
        recommentlist:result1.rows,
        commentid:commentid, 
        user:user
      }); 
    }catch(err){
      console.log(err); 
    }
  
  });
  router.post("/recomment", isLoggedIn,async(req, res) => {
  
    const commentid = req.query.commentid;
    const contents = req.body.contents; 
    
    const userprofile = req.user!.profile; 
    const useremail = req.user!.email; 
    try {  
      const result1 = await db.query("INSERT INTO recommen (comment_id, contents, email, profile) VALUES ($1, $2, $3, $4) RETURNING * ", [
        commentid,contents,useremail, userprofile       
      ]); 
        
      res.redirect("back"); 
    }catch(err){
      console.log(err); 
    }
  
  });
  router.get("/comment", isLoggedIn, async(req, res) => {
  
    const postid = req.query.postid;
    const postemail = req.query.postemail;
    const user = req.user; 
    try {  
      const result1 = await db.query("SELECT * FROM commen WHERE post_id = $1 ", [
        postid,       
      ]);  
      res.render("comment.ejs",{      
        commentlist:result1.rows,
        postid:postid, 
        postemail:postemail, 
        user:user, 
      }); 
    }catch(err){
      console.log(err); 
    }
  
  });
  router.post("/comment", isLoggedIn, async(req, res) => {
    
    const target = req.query.postid;
    const contents = req.body.contents; 
    const postemail = req.query.postemail; 
    const userprofile = req.user!.profile; 
    const useremail = req.user!.email; 
    try {  
      const result1 = await db.query("INSERT INTO commen (post_id, contents, profile, email) VALUES ($1, $2, $3, $4) RETURNING * ", [
        target,contents,userprofile,useremail       
      ]); 
        
      res.redirect("back"); 
    }catch(err){
      console.log(err); 
    }
  
  });
  router.get("/", isLoggedIn,async(req, res) => {
  
    const target = req.query.email;
    const useremail = req.user!.email; 
     
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
        target,
        
      ]);  
      const result1 = await db.query("SELECT * FROM users WHERE email = $1 ", [
        useremail,
        
      ]);  
      const result2 = await db.query("SELECT * FROM post WHERE user_email = $1 ", [
        target,       
      ]);
      res.render("post.ejs",{ 
        user:result1.rows[0], 
        target:result.rows[0],
        postlist: result2.rows,
        postemail:target
      }); 
    }catch(err){
      console.log(err); 
    }
  
     
  });
  router.get("/delete", isLoggedIn,async(req, res)=>{
  
    const commentid = req.query.commentid;
    const recommentid = req.query.recommentid;
    const postid = req.query.postid;
    const useremail = req.user!.email;  
    try {  
      if(commentid){
        const result1 = await db.query("delete from commen where id= $1  ", [
          commentid,       
        ]);
      }
      else if(recommentid){
        const result2 = await db.query("delete from recommen where id= $1  ", [
          recommentid,       
        ]);
      }
      else if(postid){
        const result3 = await db.query("delete from post where id= $1  ", [
          postid,       
        ]);
      } 
      res.redirect("back"); 
    }catch(err){
      console.log(err); 
    }
  
  });
  router.get("/like", isLoggedIn,async(req, res)=>{
  
    const commentid = req.query.commentid;
    const recommentid = req.query.recommentid;
    const postid = req.query.postid;
    const useremail = req.user!.email;  
    try {  
      if(commentid){
        const result1 = await db.query("update commen set likes = array_append(likes, $1) where id= $2  ", [
          useremail,commentid,       
        ]);
      }
      else if(recommentid){
        const result2 = await db.query("update recommen set likes = array_append(likes, $1) where id= $2  ", [
          useremail,recommentid,       
        ]);
      }
      else if(postid){
        const result2 = await db.query("update post set likes = array_append(likes, $1) where id= $2  ", [
          useremail,postid,       
        ]);
      } 
      res.redirect("back"); 
    }catch(err){
      console.log(err); 
    }
  
  });
export default router;