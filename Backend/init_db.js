const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./banking.db');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT CHECK(role IN ('CUSTOMER', 'ADMIN')) NOT NULL,
            address TEXT,
            phone TEXT,
            account_number TEXT UNIQUE,
            balance REAL DEFAULT 10000.0
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS beneficiaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            name TEXT NOT NULL,
            bank_name TEXT NOT NULL,
            account_number TEXT NOT NULL,
            transfer_limit REAL NOT NULL,
            FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_account TEXT NOT NULL,
            receiver_account TEXT NOT NULL,
            amount REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log("Database initialized successfully! 'banking.db' file created.");
});

db.close();