const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/user');

const generateErrorMessageByCode = code => {
    switch(code) {
        case 11000:
            return 'Sorry, That username is already taken.'
        default:
            return ''
    }
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    console.log('authHeader', authHeader)
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return res.send({ message: 'no token' })
    } else {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                res.send({ message: 'no user access' })
            } else {
                req.user = user
                next()
            }
        })
    }
}

router.post('/register', (req, res) => {
    const { userName, password } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.log('err', err)
            res.send('Error hashing password with bcrypt')
        }

        let user = new User({ userName, password: hash })
        user.save()
            .then(data => res.send(data))
            .catch(err => res.send(err))
    });
});

router.post('/login', (req, res, next) => {
    const { userName, password } = req.body;

    User.findOne({ userName }, (err, user) => {
        if (err) {
            console.log('err', err)
            res.send('Could not find user by that userName')
        }

        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                console.log('err', err)
                res.send('Error checking passwords')
            } else if (!result) {
                res.send('Passwords did not match')
            } else {
                /** passwords matched, serialize user w/jsonwebtoken */
                const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET)
                res.json({ accessToken })
            }
        });
    });
});

router.get('/dashboard', authenticateToken, (req, res) => {
    console.log(req.user)
})

router.post('/logout', (req, res) => {
    res.send({
        userId: '',
        userName: '',
    })
})

module.exports = router;