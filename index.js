import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";
import qs from "querystring"; 

const app = express();
const port = 3000;
const saltRounds = 10;
env.config(); 

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
  })
);
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(passport.initialize());//req에 isAuthenticated login logout등을 추가
app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

db.connect();



app.get("/", async(req, res) => {
  if (req.isAuthenticated()) {
    try {

      const result = await db.query("SELECT profile, email, array_length(follower,1) as 팔로워, array_length(followin,1) as 팔로잉  from users order by array_length(follower,1) desc nulls last limit 3 ");
      const userlist = result.rows; 
      const result1 = await db.query("SELECT profile, email, followin, follower FROM users WHERE email = $1 ", [
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
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/search", (req, res) => {
  res.render("search.ejs",{
    user: req.user, 
    searcheduser: null 
  });
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/post", async(req, res) => {
  const target = req.query.email;
  try {
    const result = await db.query("SELECT post, profile FROM users WHERE email = $1 ", [
      target,
      
    ]);  
    
    res.render("post.ejs",{profile: result.rows[0].profile, 
      post:result.rows[0].post
    }); 
  }catch(err){
    console.log(err); 
  }
   
   
}); 

app.post("/unfollow", async(req, res) => {
  const email = req.user.email;
  const target = req.query.email; 
  if (req.isAuthenticated()){
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
  // 언팔 누른 그 화면으로 리다이렉트 하고싶은데 방법을 모르겠다.
} else {
  return res.redirect("/login");
}
});

app.post("/follow", async(req, res) => {
  const email = req.user.email;
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

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);
app.post("/search", async(req, res) => {
  const email = req.body.username;
  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
      email,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.render("search.ejs",{
        searcheduser: user, 
        user: req.user
      }); 
    } else {
      console.log("user not found"); 
    }
  }catch(err){
    console.log(err);
  }
});

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  
  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      req.redirect("/login");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
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
/*
app.post("/submit1", async function (req, res) {
  const submittedProfile = req.body.profile;
  console.log(req.user);
  try {
    await db.query(`UPDATE users SET profile = $1 WHERE email = $2`, [
      submittedProfile,
      req.user.email,
    ]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});
app.post("/submit2", async function (req, res) {
  const submittedPost = req.body.post;
  console.log(req.user);
  try {
    await db.query(`UPDATE users SET post = $1 WHERE email = $2`, [
      submittedPost,
      req.user.email,
    ]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});
*/
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

passport.serializeUser((user, cb) => {
  cb(null, user);//session에 user정보 저장
});

passport.deserializeUser((user, cb) => {
  cb(null, user);//저장한 객체를 통해 req.user 만듬
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});