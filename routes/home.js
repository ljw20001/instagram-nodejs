
import pg from "pg";
import env from "dotenv";
import { Router } from 'express';
import isLoggedIn from "../auth/isLogged.js"; 

env.config();
const router = Router();
const db = new pg.Client({
    user: process.env.RDS_USERNAME,
    host: process.env.RDS_HOSTNAME,
    database: process.env.RDS_DB_NAME,
    password: process.env.RDS_PASSWORD,
    port: process.env.RDS_PORT,
  });
  
  db.connect();

  router.get("/", isLoggedIn,async(req, res) => {
  
    try {
      
      const result = await db.query("SELECT profile, email, array_length(follower,1) as 팔로워, array_length(followin,1) as 팔로잉  from users order by array_length(follower,1) desc nulls last limit 3 ");
      const userlist = result.rows; 
      const result1 = await db.query("SELECT * FROM users WHERE email = $1 ", [
        req.user.email,
        
      ]);
      const us = result1.rows[0]; 
       
    res.render("main.ejs",{list: userlist, 
      //  user:req.user
       user: us 
    });
  }catch(err){
    console.log(err); 
  }
  
});  
export default router;