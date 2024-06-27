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


import isLoggedIn from "./auth/isLogged.js"; 
import auth from "./routes/auth.js"; 
import home from "./routes/home.js"; 
import post from "./routes/posts.js";
import user from "./routes/user.js";
import search from "./routes/search.js";


const app = express();
const port = 3000;

env.config(); 

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: true,
    saveUninitialized: false,
    cookie: {
      maxAge:60*60*24*2000,  
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
  user: process.env.RDS_USERNAME,
  host: process.env.RDS_HOSTNAME,
  database: process.env.RDS_DB_NAME,
  password: process.env.RDS_PASSWORD,
  port: Number(process.env.RDS_PORT),
});

db.connect();

app.use('/authe', auth);
app.use('/', home);
app.use('/post',post); 
app.use('/search',search); 
app.use('/user',user); 


app.get("/message", isLoggedIn,async(req, res)=>{
  
  res.render("message.ejs",{user: req.user, 
    //  user:req.user
      
  });

})
io.on('connection', (socket) => {
  console.log('a user connected');
  
  socket.on('join chat', async ({ user1, user2 }) => {
      const room = [user1, user2].sort().join('_');
      socket.join(room);
      

      // 이전 메시지 불러오기
      const result = await db.query('SELECT username, message, timestamp FROM messages WHERE room = $1 ORDER BY timestamp ASC', [room]);
      console.log(room);
      socket.emit('previous messages', result.rows);
  });

  socket.on('disconnect', () => {
      
  });

  socket.on('chat message', async ({ user1, user2, username, msg }) => {
      const room = [user1, user2].sort().join('_');
       
      // 메시지 저장
      await db.query('INSERT INTO messages (room, username, message) VALUES ($1, $2, $3)', [room, username, msg]);
       
      io.to(room).emit('chat message', { username, msg });
  });
});

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});