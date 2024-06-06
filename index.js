import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";
import multer from "multer"; 
import { Server } from "socket.io";
import http from "http"; 

const app = express();
const port = 3000;
const saltRounds = 10;
env.config(); 

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: {
      expire:60*60*24,  
    },  
  })
);
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(passport.initialize());//req에 isAuthenticated login logout등을 추가
app.use(passport.session());

const server = http.createServer(app);
const io = new Server(server);

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

db.connect();

var uploadprofile = multer({
  storage : multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/profiles/');
    },
    filename: function (req, file, cb) {
      const name = file.originalname; 
      const after = name.split('.'); 
      cb(null, req.user.email+"."+after[1]);
    }, 
    fileFilter: function (req,file,callback){
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
}); 

var uploadpost = multer({
  storage : multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/posts/');
    },
    filename: function (req, file, cb) {
      const name = file.originalname; 
      const after = name.split('.'); 
      cb(null, new Date().valueOf() + name);
    }, 
    fileFilter: function (req,file,callback){
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
});
app.get("/message", async(req, res)=>{
  res.render("message.ejs",{user: req.user, 
    //  user:req.user
      
  });
})
app.post("/uploadprofile", uploadprofile.single("profile"), async function(req, res){
  try {
    const result = await db.query("update users set profile = $1 where email=$2 ", [
      req.file.filename, req.user.email    
    ]);  
    console.log(req.file); 
  }catch(err){
    console.log(err); 
  } 
  res.redirect("/profile"); 
})

app.post("/uploadpost", uploadpost.single("post"), async function(req, res){
  try {  
    const result1 = await db.query("INSERT INTO post (user_email, contents) VALUES ($1, $2) RETURNING *", [
      req.user.email, req.file.filename,     
    ]);
    console.log(req.file); 
  }catch(err){
    console.log(err); 
  } 
  res.redirect("/profile"); 
})

app.get("/", async(req, res) => {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});
app.get("/recomment", async(req, res) => {
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
app.post("/recomment", async(req, res) => {
  const commentid = req.query.commentid;
  const contents = req.body.contents; 
  
  const userprofile = req.user.profile; 
  const useremail = req.user.email; 
  try {  
    const result1 = await db.query("INSERT INTO recommen (comment_id, contents, email, profile) VALUES ($1, $2, $3, $4) RETURNING * ", [
      commentid,contents,useremail, userprofile       
    ]); 
      
    res.redirect("back"); 
  }catch(err){
    console.log(err); 
  }
});
 
app.get("/delete", async(req, res)=>{
  const commentid = req.query.commentid;
  const recommentid = req.query.recommentid;
  const postid = req.query.postid;
  const useremail = req.user.email;  
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

app.get("/like", async(req, res)=>{
  const commentid = req.query.commentid;
  const recommentid = req.query.recommentid;
  const postid = req.query.postid;
  const useremail = req.user.email;  
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
app.get("/private", async(req, res) => {
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
app.get("/comment", async(req, res) => {
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
app.post("/comment", async(req, res) => {
  const target = req.query.postid;
  const contents = req.body.contents; 
  const postemail = req.query.postemail; 
  const userprofile = req.user.profile; 
  const useremail = req.user.email; 
  try {  
    const result1 = await db.query("INSERT INTO commen (post_id, contents, profile, email) VALUES ($1, $2, $3, $4) RETURNING * ", [
      target,contents,userprofile,useremail       
    ]); 
      
    res.redirect("back"); 
  }catch(err){
    console.log(err); 
  }
});
app.get("/profile", async(req, res) => {
  if (req.isAuthenticated()) {
    const useremail=req.user.email; 
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
} else {
  res.redirect("/login");
}
});

app.get("/search", (req, res) => {
  if (req.isAuthenticated()) {
  res.render("search.ejs",{
    user: req.user, 
    searcheduser: null 
  });
} else {
  res.redirect("/login");
}
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/post", async(req, res) => {
  if (req.isAuthenticated()) {
  const target = req.query.email;
  const useremail = req.user.email; 
   
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
} else {
  res.redirect("/login");
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
  const user1 = req.user; 
  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
      email,
    ]);
    const result1 = await db.query("SELECT * FROM users WHERE email = $1 ", [
      user1.email,
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
app.get("/block", async(req, res) => {
  const email = req.query.email;
  const user = req.user; 
  try {
    const result = await db.query("update users set block = array_append(block, $1) where email= $2 ", [
      email,user.email
    ]);
    
  }catch(err){
    console.log(err);
  }
  res.redirect("back");
});
app.get("/unblock", async(req, res) => {
  const email = req.query.email;
  const user = req.user; 
  try {
    const result = await db.query("update users set block = array_remove(block, $1) where email= $2 ", [
      email,user.email
    ]);
    
  }catch(err){
    console.log(err);
  }
  res.redirect("back");
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
io.on('connection', (socket) => {
  console.log('a user connected');
  
  socket.on('join chat', async ({ user1, user2 }) => {
      const room = [user1, user2].sort().join('_');
      socket.join(room);
      console.log(`User ${user1} and ${user2} joined room: ${room}`);

      // 이전 메시지 불러오기
      const result = await db.query('SELECT username, message, timestamp FROM messages WHERE room = $1 ORDER BY timestamp ASC', [room]);
      console.log(room);
      socket.emit('previous messages', result.rows);
  });

  socket.on('disconnect', () => {
      console.log('user disconnected');
  });

  socket.on('chat message', async ({ user1, user2, username, msg }) => {
      const room = [user1, user2].sort().join('_');
       
      // 메시지 저장
      await db.query('INSERT INTO messages (room, username, message) VALUES ($1, $2, $3)', [room, username, msg]);
       
      io.to(room).emit('chat message', { username, msg });
  });
});
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
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);
app.get(
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
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/cb",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
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

passport.deserializeUser((user, cb) => {
  cb(null, user);//저장한 객체를 통해 req.user 만듬
});

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});