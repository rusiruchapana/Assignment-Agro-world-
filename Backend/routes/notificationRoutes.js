const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const {
    getUserNotifications,
    markAsRead,
    markAllAsRead
} = require('../services/notificationService');


router.get('/', auth(), async (req, res) => {
    try {
        const { unread, limit } = req.query;
        const notifications = await getUserNotifications(
            req.user.id,
            unread === 'true',
            parseInt(limit) || 20
        );
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.patch('/:id/read', auth(), async (req, res) => {
    try {
        await markAsRead(req.params.id, req.user.id);
        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.patch('/read-all', auth(), async (req, res) => {
    try {
        await markAllAsRead(req.user.id);
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.patch('/preferences', auth(), async (req, res) => {
    try {
        const { email_notifications } = req.body;
        
        if (typeof email_notifications !== 'boolean') {
            return res.status(400).json({ message: 'Invalid preference value' });
        }

        await pool.execute(
            'UPDATE users SET email_notifications = ? WHERE id = ?',
            [email_notifications, req.user.id]
        );

        res.json({ message: 'Notification preferences updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;