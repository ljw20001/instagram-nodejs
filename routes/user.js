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
const path_1 = __importDefault(require("path"));
const express_1 = require("express");
const isLogged_js_1 = __importDefault(require("../auth/isLogged.js"));
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
        cb(null, 'public/profiles/');
    },
    filename: function (req, file, cb) {
        const name = file.originalname;
        const after = name.split('.');
        cb(null, req.user.email + "." + after[1]);
    },
});
const uploadprofile = (0, multer_1.default)({
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
router.post("/uploadprofile", isLogged_js_1.default, uploadprofile.single("profile"), function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield db.query("update users set profile = $1 where email=$2 ", [
                req.file.filename, req.user.email
            ]);
            const result2 = yield db.query("update commen set profile = $1 where email=$2 ", [
                req.file.filename, req.user.email
            ]);
            console.log(req.file);
        }
        catch (err) {
            console.log(err);
        }
        res.redirect("/user/profile");
    });
});
router.get("/private", isLogged_js_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.query.email;
    const boolean = req.query.boolean;
    try {
        const result1 = yield db.query("update users set private=$1 where email= $2 ", [
            boolean, email,
        ]);
        res.redirect("back");
    }
    catch (err) {
        console.log(err);
    }
}));
router.get("/profile", isLogged_js_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const useremail = req.user.email;
    try {
        const result1 = yield db.query("SELECT * FROM users WHERE email = $1 ", [
            useremail,
        ]);
        const result2 = yield db.query("SELECT * FROM post WHERE user_email = $1 ", [
            useremail,
        ]);
        res.render("profile.ejs", {
            user: result1.rows[0],
            postlist: result2.rows,
        });
    }
    catch (err) {
        console.log(err);
    }
}));
router.post("/unfollow", isLogged_js_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.user.email;
    const target = req.query.email;
    try {
        const result = yield db.query("update users set followin = array_remove(followin, $1) where email= $2 ", [
            target, email
        ]);
    }
    catch (err) {
        console.log(err);
    }
    try {
        const result = yield db.query("update users set follower = array_remove(follower, $1) where email= $2 ", [
            email, target
        ]);
    }
    catch (err) {
        console.log(err);
    }
    res.redirect("/");
}));
router.post("/follow", isLogged_js_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.user.email;
    const target = req.query.email;
    try {
        const result = yield db.query("update users set followin = array_append(followin, $1) where email= $2 ", [
            target, email
        ]);
    }
    catch (err) {
        console.log(err);
    }
    try {
        const result = yield db.query("update users set follower = array_append(follower, $1) where email= $2 ", [
            email, target
        ]);
    }
    catch (err) {
        console.log(err);
    }
    return res.redirect("/post?email=" + target);
}));
router.get("/block", isLogged_js_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.query.email;
    const user = req.user;
    try {
        const result = yield db.query("update users set block = array_append(block, $1) where email= $2 ", [
            email, user.email
        ]);
    }
    catch (err) {
        console.log(err);
    }
    res.redirect("back");
}));
router.get("/unblock", isLogged_js_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.query.email;
    const user = req.user;
    try {
        const result = yield db.query("update users set block = array_remove(block, $1) where email= $2 ", [
            email, user.email
        ]);
    }
    catch (err) {
        console.log(err);
    }
    res.redirect("back");
}));
exports.default = router;
