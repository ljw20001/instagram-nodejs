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
const dotenv_1 = __importDefault(require("dotenv"));
const multer_1 = __importDefault(require("multer"));
const express_1 = require("express");
const isLogged_js_1 = __importDefault(require("../auth/isLogged.js"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const router = (0, express_1.Router)();
const db = new pg_1.default.Client({
    user: process.env.RDS_USERNAME,
    host: process.env.RDS_HOSTNAME,
    database: process.env.RDS_DB_NAME,
    password: process.env.RDS_PASSWORD,
    port: Number(process.env.RDS_PORT),
});
db.connect();
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/posts/');
    },
    filename: function (req, file, cb) {
        const name = Math.random().toString(36).substring(2, 11);
        cb(null, new Date().valueOf() + name);
    },
});
const uploadpost = (0, multer_1.default)({
    storage: storage,
    fileFilter: function (req, file, callback) {
        var ext = path_1.default.extname(file.originalname);
        if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
            return callback(new Error("png jpg만"));
        }
        callback(null, true);
    },
    limits: {
        fileSize: 1024 * 1024,
    },
});
router.post("/uploadpost", isLogged_js_1.default, uploadpost.single("post"), function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result1 = yield db.query("INSERT INTO post (user_email, contents) VALUES ($1, $2) RETURNING *", [
                req.user.email, req.file.filename,
            ]);
        }
        catch (err) {
            console.log(err);
        }
        res.redirect("/user/profile");
    });
});
router.get("/recomment", isLogged_js_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const commentid = req.query.commentid;
    const user = req.user;
    try {
        const result1 = yield db.query("SELECT * FROM recommen WHERE comment_id = $1 ", [
            commentid,
        ]);
        res.render("recomment.ejs", {
            recommentlist: result1.rows,
            commentid: commentid,
            user: user
        });
    }
    catch (err) {
        console.log(err);
    }
}));
router.post("/recomment", isLogged_js_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const commentid = req.query.commentid;
    const contents = req.body.contents;
    const userprofile = req.user.profile;
    const useremail = req.user.email;
    try {
        const result1 = yield db.query("INSERT INTO recommen (comment_id, contents, email, profile) VALUES ($1, $2, $3, $4) RETURNING * ", [
            commentid, contents, useremail, userprofile
        ]);
        res.redirect("back");
    }
    catch (err) {
        console.log(err);
    }
}));
router.get("/comment", isLogged_js_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const postid = req.query.postid;
    const postemail = req.query.postemail;
    const user = req.user;
    try {
        const result1 = yield db.query("SELECT * FROM commen WHERE post_id = $1 ", [
            postid,
        ]);
        res.render("comment.ejs", {
            commentlist: result1.rows,
            postid: postid,
            postemail: postemail,
            user: user,
        });
    }
    catch (err) {
        console.log(err);
    }
}));
router.post("/comment", isLogged_js_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const target = req.query.postid;
    const contents = req.body.contents;
    const postemail = req.query.postemail;
    const userprofile = req.user.profile;
    const useremail = req.user.email;
    try {
        const result1 = yield db.query("INSERT INTO commen (post_id, contents, profile, email) VALUES ($1, $2, $3, $4) RETURNING * ", [
            target, contents, userprofile, useremail
        ]);
        res.redirect("back");
    }
    catch (err) {
        console.log(err);
    }
}));
router.get("/", isLogged_js_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const target = req.query.email;
    const useremail = req.user.email;
    try {
        const result = yield db.query("SELECT * FROM users WHERE email = $1 ", [
            target,
        ]);
        const result1 = yield db.query("SELECT * FROM users WHERE email = $1 ", [
            useremail,
        ]);
        const result2 = yield db.query("SELECT * FROM post WHERE user_email = $1 ", [
            target,
        ]);
        res.render("post.ejs", {
            user: result1.rows[0],
            target: result.rows[0],
            postlist: result2.rows,
            postemail: target
        });
    }
    catch (err) {
        console.log(err);
    }
}));
router.get("/delete", isLogged_js_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const commentid = req.query.commentid;
    const recommentid = req.query.recommentid;
    const postid = req.query.postid;
    const useremail = req.user.email;
    try {
        if (commentid) {
            const result1 = yield db.query("delete from commen where id= $1  ", [
                commentid,
            ]);
        }
        else if (recommentid) {
            const result2 = yield db.query("delete from recommen where id= $1  ", [
                recommentid,
            ]);
        }
        else if (postid) {
            const result3 = yield db.query("delete from post where id= $1  ", [
                postid,
            ]);
        }
        res.redirect("back");
    }
    catch (err) {
        console.log(err);
    }
}));
router.get("/like", isLogged_js_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const commentid = req.query.commentid;
    const recommentid = req.query.recommentid;
    const postid = req.query.postid;
    const useremail = req.user.email;
    try {
        if (commentid) {
            const result1 = yield db.query("update commen set likes = array_append(likes, $1) where id= $2  ", [
                useremail, commentid,
            ]);
        }
        else if (recommentid) {
            const result2 = yield db.query("update recommen set likes = array_append(likes, $1) where id= $2  ", [
                useremail, recommentid,
            ]);
        }
        else if (postid) {
            const result2 = yield db.query("update post set likes = array_append(likes, $1) where id= $2  ", [
                useremail, postid,
            ]);
        }
        res.redirect("back");
    }
    catch (err) {
        console.log(err);
    }
}));
exports.default = router;
