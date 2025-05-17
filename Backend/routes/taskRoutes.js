const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

router.post('/', auth(), async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: 'Request body is empty' });
        }

        
        const { title, description, assigned_to } = req.body;
        const created_by = req.user.id;
        
        
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }
        
        
        const [result] = await pool.execute(
            'insert into tasks (title, description, created_by, assigned_to) values (?, ?, ?, ?)',
            [title, description, created_by, assigned_to || null]
        );
        
        
        const [tasks] = await pool.execute(
            `select t.*, u1.username as created_by_username, u2.username as assigned_to_username 
             from tasks t 
             left join users u1 ON t.created_by = u1.id 
             left join users u2 ON t.assigned_to = u2.id 
             where t.id = ?`,
            [result.insertId]
        );
        
        res.status(201).json(tasks[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;