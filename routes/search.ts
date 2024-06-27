
import pg from "pg";
import env from "dotenv";; 
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

router.get("/", isLoggedIn,(req, res) => {
  
    res.render("search.ejs",{
      user: req.user, 
      searcheduser: null 
    });
  
  });

  router.post("/", isLoggedIn,async(req, res) => {
  
    const email = req.body.username;
    const user1 = req.user; 
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
        email,
      ]);
      const result1 = await db.query("SELECT * FROM users WHERE email = $1 ", [
        user1!.email,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const requser = result1.rows[0]; 
        res.render("search.ejs",{
          searcheduser: user, 
          user: requser
        }); 
      } else {
        console.log("user not found"); 
      }
    
    }catch(err){
      console.log(err);
    }
  
  });
  export default router;