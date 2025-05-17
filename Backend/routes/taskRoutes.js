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


router.get('/', auth(), async (req, res) => {
    try {
        const { status, assigned_to } = req.query;
        let query = `
            select t.*, u1.username as created_by_username, u2.username as assigned_to_username 
            from tasks t 
            left join users u1 on t.created_by = u1.id 
            left join users u2 on t.assigned_to = u2.id
        `;
        
        const params = [];
        const conditions = [];
        
        
        if (req.user.role === 'user') {
            conditions.push('(t.assigned_to = ? or t.created_by = ?)');
            params.push(req.user.id, req.user.id);
        }
        
        
        if (status) {
            conditions.push('t.status = ?');
            params.push(status);
        }
        
        
        if (assigned_to) {
            conditions.push('t.assigned_to = ?');
            params.push(assigned_to);
        }
        
        
        if (conditions.length) {
            query += ' where ' + conditions.join(' and ');
        }
        
        query += ' order by t.created_at desc';
        
        const [tasks] = await pool.execute(query, params);
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:id', auth(), async (req, res) => {
    try {
        const { id } = req.params;
        
        const [tasks] = await pool.execute(
            `select t.*, u1.username as created_by_username, u2.username as assigned_to_username 
             from tasks t 
             left join users u1 ON t.created_by = u1.id 
             left join users u2 ON t.assigned_to = u2.id 
             where t.id = ?`,
            [id]
        );
        
        if (tasks.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        const task = tasks[0];
        
        
        if (task.assigned_to !== req.user.id && task.created_by !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view this task' });
        }
        
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/:id/status', auth(), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        
        const validStatuses = ['pending', 'in_progress', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        
        
        const [tasks] = await pool.execute('select * from tasks where id = ?', [id]);
        if (tasks.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        const task = tasks[0];
        if (task.assigned_to !== req.user.id && task.created_by !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this task' });
        }
        
        
        await pool.execute(
            'update tasks set status = ? where id = ?',
            [status, id]
        );
        
        res.json({ message: 'Task status updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.patch('/:id/assign', auth(['admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;
        const { assigned_to } = req.body;
        
        
        const [tasks] = await pool.execute('select * from tasks where id = ?', [id]);
        if (tasks.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        
        if (assigned_to) {
            const [users] = await pool.execute('select * from users where id = ?', [assigned_to]);
            if (users.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
        }
        
        
        await pool.execute(
            'update tasks SET assigned_to = ? where id = ?',
            [assigned_to || null, id]
        );
        
        res.json({ message: 'Task assignment updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});




module.exports = router;