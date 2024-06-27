"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = __importDefault(require("pg"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const passport_google_oauth2_1 = require("passport-google-oauth2");
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const saltRounds = 10;
dotenv_1.default.config();
const router = (0, express_1.Router)();
const db = new pg_1.default.Client({
    user: process.env.RDS_USERNAME,
    host: process.env.RDS_HOSTNAME,
    database: process.env.RDS_DB_NAME,
    password: process.env.RDS_PASSWORD,
    port: Number(process.env.RDS_PORT)
});
db.connect();
router.get("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield axios_1.default.get("https://api.api-ninjas.com/v1/quotes?category=happiness", { headers: { 'X-Api-Key': 'g2uItxFEL/dNnJaWdu/GUQ==TQWZTNSig8vKQR0b' } });
        res.render("login.ejs", {
            quote: result.data[0].quote
        });
    }
    catch (err) {
        console.log(err);
        res.status(500);
    }
}));
router.post("/login", passport_1.default.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
}));
passport_1.default.use("local", new passport_local_1.Strategy(function verify(username, password, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield db.query("SELECT * FROM users WHERE email = $1 ", [
                username,
            ]);
            if (result.rows.length > 0) {
                const user = result.rows[0];
                const storedHashedPassword = user.password;
                bcrypt_1.default.compare(password, storedHashedPassword, (err, valid) => {
                    if (err) {
                        console.error("Error comparing passwords:", err);
                        return cb(err);
                    }
                    else {
                        if (valid) {
                            return cb(null, user);
                        }
                        else {
                            return cb(null, false);
                        }
                    }
                });
            }
            else {
                return cb("User not found");
            }
        }
        catch (err) {
            console.log(err);
        }
    });
}));
router.get("/auth/google", passport_1.default.authenticate("google", {
    scope: ["profile", "email"],
}));
router.get("/auth/google/cb", passport_1.default.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/login",
}));
passport_1.default.use("google", new passport_google_oauth2_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/cb",
}, (accessToken, refreshToken, profile, cb) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db.query("SELECT * FROM users WHERE email = $1", [
            profile.email,
        ]);
        if (result.rows.length === 0) {
            const newUser = yield db.query("INSERT INTO users (email, password) VALUES ($1, $2)", [profile.email, "google"]);
            return cb(null, newUser.rows[0]);
        }
        else {
            return cb(null, result.rows[0]);
        }
    }
    catch (err) {
        return cb(err);
    }
})));
passport_1.default.serializeUser((user, cb) => {
    cb(null, user); //session에 user정보 저장
});
passport_1.default.deserializeUser((user, cb) => {
    cb(null, user); //저장한 객체를 통해 req.user 만듬
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
router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.body.username;
    const password = req.body.password;
    try {
        const checkResult = yield db.query("SELECT * FROM users WHERE email = $1", [
            email,
        ]);
        if (checkResult.rows.length > 0) {
            res.redirect("/authe/login");
        }
        else {
            bcrypt_1.default.hash(password, saltRounds, (err, hash) => __awaiter(void 0, void 0, void 0, function* () {
                if (err) {
                    console.error("Error hashing password:", err);
                }
                else {
                    const result = yield db.query("INSERT INTO users (email, password, profile) VALUES ($1, $2, 'basic.png') RETURNING *", [email, hash]);
                    const user = result.rows[0];
                    req.login(user, (err) => {
                        console.log("success");
                        res.redirect("/");
                    });
                }
            }));
        }
    }
    catch (err) {
        console.log(err);
    }
}));
exports.default = router;
