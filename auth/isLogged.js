"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect("/authe/login");
    }
}
exports.default = isLoggedIn;
