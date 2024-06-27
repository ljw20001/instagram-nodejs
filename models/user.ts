import pg from "pg";
import env from "dotenv";
import { Router } from 'express';
import isLoggedIn from "../auth/isLogged.js"; 

env.config();

class User {
    id!: number; 
    email!: string;
    password!: string;
    profile!: string;
    block!: string[];
    followin!: string[];
    follower!: string[];
    private!: boolean; 
}

export default User; 