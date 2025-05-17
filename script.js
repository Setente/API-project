const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const users = {}; // username: { studentNumber, phoneNumber, verified: false, verificationCode }
const posts = []; // { userId, message, timestamp }
 
const twilioAccountSid = 'AC79fa3dcc7899fc81c6c1649471f17fc9'; // Replace with your Twilio credentials
const twilioAuthToken = 'f338478a64109eba5ebf11254a6d969f';
const twilioClient = require('twilio')(twilioAccountSid, twilioAuthToken);

// Endpoint to register user and send verification code
app.post('/register', async (req, res) => {
    const { username, studentNumber, phoneNumber } = req.body;
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save user data temporarily
    users[username] = {
        studentNumber,
        phoneNumber,
        verified: false,
        verificationCode
    };

    // Send SMS with verification code
    try {
        await twilioClient.messages.create({
            body: `Your verification code is: ${verificationCode}`,
            from: '56341385', // Replace with your Twilio number
            to: phoneNumber
        });
        res.json({ success: true, message: 'Verification code sent' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to send SMS' });
    }
});

// Endpoint to verify code
app.post('/verify', (req, res) => {
    const { username, code } = req.body;
    const user = users[username];
    if (user && user.verificationCode === code) {
        user.verified = true;
        res.json({ success: true, message: 'User verified' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid verification code' });
    }
});

// Endpoint to post a message
app.post('/post', (req, res) => {
    const { username, message } = req.body;
    const user = users[username];
    if (user && user.verified) {
        const post = {
            userId: username,
            message,
            timestamp: new Date()
        };
        posts.push(post);
        res.json({ success: true, post });
    } else {
        res.status(403).json({ success: false, message: 'User not verified' });
    }
});

// Endpoint to get all posts
app.get('/posts', (req, res) => {
    res.json(posts);
});

// Start server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});