import { Response, NextFunction, Request} from "express";

function isLoggedIn(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated!()) {
      next();
    } else {
      res.redirect("/authe/login");
    }
}

export default isLoggedIn