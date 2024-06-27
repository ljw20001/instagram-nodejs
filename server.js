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
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const pg_1 = __importDefault(require("pg"));
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const isLogged_js_1 = __importDefault(require("./auth/isLogged.js"));
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const home_js_1 = __importDefault(require("./routes/home.js"));
const posts_js_1 = __importDefault(require("./routes/posts.js"));
const user_js_1 = __importDefault(require("./routes/user.js"));
const search_js_1 = __importDefault(require("./routes/search.js"));
const app = (0, express_1.default)();
const port = 3000;
dotenv_1.default.config();
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 60 * 60 * 24 * 2000,
    },
}));
app.use(express_1.default.static("public"));
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(passport_1.default.initialize()); //req에 isAuthenticated login logout등을 추가
app.use(passport_1.default.session());
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
const db = new pg_1.default.Client({
    user: process.env.RDS_USERNAME,
    host: process.env.RDS_HOSTNAME,
    database: process.env.RDS_DB_NAME,
    password: process.env.RDS_PASSWORD,
    port: Number(process.env.RDS_PORT),
});
db.connect();
app.use('/authe', auth_js_1.default);
app.use('/', home_js_1.default);
app.use('/post', posts_js_1.default);
app.use('/search', search_js_1.default);
app.use('/user', user_js_1.default);
app.get("/message", isLogged_js_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render("message.ejs", { user: req.user,
        //  user:req.user
    });
}));
io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('join chat', (_a) => __awaiter(void 0, [_a], void 0, function* ({ user1, user2 }) {
        const room = [user1, user2].sort().join('_');
        socket.join(room);
        // 이전 메시지 불러오기
        const result = yield db.query('SELECT username, message, timestamp FROM messages WHERE room = $1 ORDER BY timestamp ASC', [room]);
        console.log(room);
        socket.emit('previous messages', result.rows);
    }));
    socket.on('disconnect', () => {
    });
    socket.on('chat message', (_b) => __awaiter(void 0, [_b], void 0, function* ({ user1, user2, username, msg }) {
        const room = [user1, user2].sort().join('_');
        // 메시지 저장
        yield db.query('INSERT INTO messages (room, username, message) VALUES ($1, $2, $3)', [room, username, msg]);
        io.to(room).emit('chat message', { username, msg });
    }));
});
server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
