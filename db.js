const sqlite3 = require('sqlite3').verbose(); // dopolnitelni logovi prikazuva
const path = require('path'); // path modulot go zemam

const dbPath = path.join(__dirname, 'data', 'mydatabase.db'); // Adjust the folder name and database name as needed
const db = new sqlite3.Database('./data.db');

// Create tables // se izvrsuvaat 1 po 1 metodite.
db.serialize(() => {
    // Create the 'users' table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    `);

    // Create the 'food' table
    db.run(`
        CREATE TABLE IF NOT EXISTS food (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            cookTime TEXT NOT NULL,
            price REAL NOT NULL,
            favourite BOOLEAN DEFAULT 0,
            origins TEXT,
            star REAL,
            imageUrl TEXT,
            tags TEXT
        )
    `);

    // Create the 'orders' table
    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            dateCreated INTEGER,  -- Store a timestamp in milliseconds (INTEGER)
            status TEXT DEFAULT 'pending',
            FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Create the 'orderItems' table
    db.run(`
        CREATE TABLE IF NOT EXISTS orderItems (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            orderId INTEGER,
            itemId INTEGER,
            quantity INTEGER,
            FOREIGN KEY(orderId) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY(itemId) REFERENCES food(id) ON DELETE CASCADE
        )
    `);
    // Enable foreign key support

     // Create the 'archived_orders' table
     db.run(`
        CREATE TABLE IF NOT EXISTS archived_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            dateCreated INTEGER,
            status TEXT,
            FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Create the 'archived_orderItems' table
    db.run(`
        CREATE TABLE IF NOT EXISTS archived_orderItems (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            orderId INTEGER,
            itemId INTEGER,
            quantity INTEGER,
            FOREIGN KEY(orderId) REFERENCES archived_orders(id) ON DELETE CASCADE,
            FOREIGN KEY(itemId) REFERENCES food(id) ON DELETE CASCADE
        )
    `);
db.run('PRAGMA foreign_keys = ON;'); // ovoa e za da moze da go izbrisam redot sto ima foreign key!!!!

});

module.exports = db;
