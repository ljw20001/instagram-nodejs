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
;
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
router.get("/", isLogged_js_1.default, (req, res) => {
    res.render("search.ejs", {
        user: req.user,
        searcheduser: null
    });
});
router.post("/", isLogged_js_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.body.username;
    const user1 = req.user;
    try {
        const result = yield db.query("SELECT * FROM users WHERE email = $1 ", [
            email,
        ]);
        const result1 = yield db.query("SELECT * FROM users WHERE email = $1 ", [
            user1.email,
        ]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const requser = result1.rows[0];
            res.render("search.ejs", {
                searcheduser: user,
                user: requser
            });
        }
        else {
            console.log("user not found");
        }
    }
    catch (err) {
        console.log(err);
    }
}));
exports.default = router;
