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
router.get("/", isLogged_js_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db.query("SELECT profile, email, array_length(follower,1) as 팔로워, array_length(followin,1) as 팔로잉  from users order by array_length(follower,1) desc nulls last limit 3 ");
        const userlist = result.rows;
        const result1 = yield db.query("SELECT * FROM users WHERE email = $1 ", [
            req.user.email,
        ]);
        const us = result1.rows[0];
        res.render("main.ejs", { list: userlist,
            //  user:req.user
            user: us
        });
    }
    catch (err) {
        console.log(err);
    }
}));
exports.default = router;
