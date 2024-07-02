
import pg from "pg";
import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy } from "passport-local";
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';

import env from "dotenv";

import { Router } from 'express';
import axios from "axios";
const saltRounds = 10;
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

router.get("/login", async(req, res) => {
    try{ 
      const result = await axios.get("https://api.api-ninjas.com/v1/quotes?category=happiness",
        {headers: {'X-Api-Key': 'g2uItxFEL/dNnJaWdu/GUQ==TQWZTNSig8vKQR0b'}}
      );
      
    res.render("login.ejs", {
      quote: result.data[0].quote 
    });
    }catch(err){
      console.log(err); 
      res.status(500); 
    }
    
  });
router.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/login",
    })
);
passport.use(
    "local",
    new Strategy(async function verify(username, password, cb) {
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
          username,
        ]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const storedHashedPassword = user.password;
          bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
              console.error("Error comparing passwords:", err);
              return cb(err);
            } else {
              if (valid) {
                return cb(null, user);
              } else {
                return cb(null, false);
              }
            }
          });
        } else {
          return cb("User not found");
        }
      } catch (err) {
        console.log(err);
      }
    })
  );
  router.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );
  
  router.get(
    "/auth/google/cb",
    passport.authenticate("google", {
      successRedirect: "/",
      failureRedirect: "/login",
    })
  );
  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: "http://localhost:3000/auth/google/cb",
      },
      async (accessToken: string, refreshToken: string, profile: any, cb: any) => {
        try {
          const result = await db.query("SELECT * FROM users WHERE email = $1", [
            profile.email,
          ]);
          if (result.rows.length === 0) {
            const newUser = await db.query(
              "INSERT INTO users (email, password) VALUES ($1, $2)",
              [profile.email, "google"]
            );
            return cb(null, newUser.rows[0]);
          } else {
            return cb(null, result.rows[0]);
          }
        } catch (err) {
          return cb(err);
        }
      }
    )
  );
  passport.serializeUser((user, cb) => {
    cb(null, user);//session에 user정보 저장
  });
  
  passport.deserializeUser((user: Express.User, cb) => {
    cb(null, user);//저장한 객체를 통해 req.user 만듬
  });
router.get("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) {
        res.send(err);
      }
      res.redirect("/authe/login");
    });
  });

  router.get("/register", (req, res) => {
    res.render("register.ejs");
  });

  
  router.post("/register", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;
    
    try {
      const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
  
      if (checkResult.rows.length > 0) {
        res.redirect("/authe/login");
      } else {
        bcrypt.hash(password, saltRounds, async (err, hash) => {
          if (err) {
            console.error("Error hashing password:", err);
          } else {
            const result = await db.query(
              "INSERT INTO users (email, password, profile) VALUES ($1, $2, 'basic.png') RETURNING *",
              [email, hash]
            );
            const user = result.rows[0];
            req.login(user, (err) => {
              console.log("success");
              res.redirect("/");
            });
          }
        });
      }
    } catch (err) {
      console.log(err);
    }
  });
export default router;