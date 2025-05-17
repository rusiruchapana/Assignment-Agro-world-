const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const dotenv = require('dotenv');

dotenv.config();

router.post('/register' , async(req,res)=>{
    try{
        const {username,email,password,role} = req.body;
        const [users] = await pool.execute(
            'select * from users where email=? or username=?',
            [email, username]
        );

        if(users.length>0){
            return res.status(400).json({message: 'User already exists'});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'insert into users (username,email,password,role) values(?,?,?,?)',
            [username,email,hashedPassword,role || 'user'] 
        );

        const payload = {
            id: result.insertId,
            username,
            role: role || 'user'
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES_IN}
        );

        res.status(201).json({token});
    }catch(err){
        res.status(500).json({message: err.message});
    }
});


module.exports = router;







