const pool = require('../config/db');
const nodemailer = require('nodemailer');
const { getIO } = require('./socketService');
const dotenv = require('dotenv');

dotenv.config();


const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


const sendNotification = async (userId, message, type, taskId = null) => {
    try {
        
        const [result] = await pool.execute(
            'insert into notifications (user_id, task_id, message, type) VALUES (?, ?, ?, ?)',
            [userId, taskId, message, type]
        );

        
        const [users] = await pool.execute(
            'select email, email_notifications from users where id = ?',
            [userId]
        );

        if (users.length > 0 && users[0].email_notifications) {
            
            await transporter.sendMail({
                from: `Task Manager <${process.env.EMAIL_USER}>`,
                to: users[0].email,
                subject: 'Task Manager Notification',
                html: `
                    <h2>New Notification</h2>
                    <p>${message}</p>
                    ${taskId ? `<p>View task: <a href="${process.env.FRONTEND_URL}/tasks/${taskId}">Task #${taskId}</a></p>` : ''}
                    <hr>
                    <small>You can manage your notification preferences in your account settings.</small>
                `
            });
        }

        
        if (process.env.WS_ENABLED === 'true') {
            const io = getIO();
            io.to(`user_${userId}`).emit('new_notification', {
                id: result.insertId,
                message,
                type,
                taskId,
                createdAt: new Date()
            });
        }

        return result.insertId;
    } catch (err) {
        console.error('Notification error:', err);
        throw err;
    }
};


const getUserNotifications = async (userId, unreadOnly = false, limit = 20) => {
    let query = `
        select n.*, t.title as task_title 
        from notifications n
        left join tasks t ON n.task_id = t.id
        where n.user_id = ?
    `;

    const params = [userId];

    if (unreadOnly) {
        query += ' and n.is_read = FALSE';
    }

    query += ' order BY n.created_at DESC LIMIT ?';
    params.push(limit);

    const [notifications] = await pool.execute(query, params);
    return notifications;
};


const markAsRead = async (notificationId, userId) => {
    await pool.execute(
        'update notifications set is_read = TRUE where id = ? and user_id = ?',
        [notificationId, userId]
    );
};


const markAllAsRead = async (userId) => {
    await pool.execute(
        'update notifications set is_read = TRUE where user_id = ? and is_read = FALSE',
        [userId]
    );
};

module.exports = {
    sendNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead
};