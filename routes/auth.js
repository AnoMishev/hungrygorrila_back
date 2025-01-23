const express = require('express');
const bcrypt = require('bcryptjs'); // za pasvordi
const jwt = require('jsonwebtoken'); // avtentikacija i avtorizacija zatoa se koristi JSON WEB TOKENOT!
const db = require('../db');

const router = express.Router();

// Register a new user
router.post('/register', (req, res) => {
    const { username, password } = req.body;
    const role = 'user'; // Default role
    const hashedPassword = bcrypt.hashSync(password, 8); // 8 znaci salt za bezbednost.

    db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, hashedPassword, role], function (err) {
        if (err) return res.status(500).send("There was a problem registering the user.");
        res.status(201).send({ id: this.lastID, username, role });
    });
});

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err || !user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).send("Invalid credentials.");
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, 'secret', { expiresIn: 86400 }); //ТУКА КРЕИРАМ ТОКЕН!! СЕКОЈ ТОКЕН ИМА ХЕДДЕР, ПЕЈЛОАД И СИГНАТУРЕ.
        // ХЕДЕР Е ЗА МЕТА ПОДАТОЦИ, ПЕЈЛОАД ЗА ИД,ЈУСЕЕРНЕЈМ, А СИГНАТУРЕ Е КЛУЧ СО КОЈ СЕ ПРОВЕРУВА ВАЛИДНОСТА НА ТОКЕНОТ.
        res.status(200).send({ auth: true, token });
    });
});

module.exports = router;
