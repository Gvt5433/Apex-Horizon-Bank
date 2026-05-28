// Connect to the SQLite Database instance
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../banking.db'));

// ==========================================
// 1. BULLETPROOF USER REGISTRATION
// ==========================================
exports.register = (req, res) => {
    // Capture any possible field naming variation from your React form state
    const name = req.body.name || req.body.fullName || req.body.username || req.body.corporateName || req.body.fullCorporateName || 'User';
    const email = req.body.email;
    const password = req.body.password;
    const role = req.body.role || 'CUSTOMER';
    const address = req.body.address || '';
    const phone = req.body.phone || '';

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required parameters." });
    }

    // Standardize the role value for the database structure
    const finalRole = (role.toString().toUpperCase().includes('ADMIN')) ? 'ADMIN' : 'CUSTOMER';
    const startingBalance = finalRole === 'ADMIN' ? 0.00 : 10000.00;
    const accountNumber = 'ACC' + Math.floor(1000000000 + Math.random() * 9000000000);

    // SQL query matching your schema exactly
    const query = `INSERT INTO users (name, email, password, role, address, phone, account_number, balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [name, email, password, finalRole, address, phone, accountNumber, startingBalance], function (err) {
        if (err) {
            console.error("Database Error:", err.message);
            return res.status(400).json({ error: "Database execution failed or email exists." });
        }
        return res.json({ message: "Registration completely verified and saved." });
    });
};

// ==========================================
// 2. BULLETPROOF USER GATEWAY AUTHENTICATION
// ==========================================
exports.login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Missing identity matrices." });
    }

    const query = `SELECT * FROM users WHERE email = ? AND password = ?`;
    db.get(query, [email, password], (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database internal check error." });
        }
        if (!user) {
            // This maps directly to the pink banner error on your screen
            return res.status(400).json({ error: "Invalid entry parameters." });
        }

        // Return user context back to frontend portal state storage
        return res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                account_number: user.account_number,
                balance: user.balance
            }
        });
    });
};

// 3. UPDATE PROFILE DETAILS (Common Functionality)
exports.updateProfile = (req, res) => {
    const { id, name, address, phone } = req.body;
    db.run(`UPDATE users SET name = ?, address = ?, phone = ? WHERE id = ?`, [name, address, phone, id], function(err) {
        if (err) return res.status(500).json({ error: "Failed to update details." });
        res.json({ message: "Details updated successfully!" });
    });
};

// 4. GET SINGLE PROFILE INFO (Customer View Profile)
exports.getProfile = (req, res) => {
    const { id } = req.params;
    db.get(`SELECT id, name, email, role, address, phone, account_number, balance FROM users WHERE id = ?`, [id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: "User not found." });
        res.json(row);
    });
};

// 5. VIEW MY TRANSACTIONS (Customer Ledger)
exports.getCustomerTransactions = (req, res) => {
    const { accountNumber } = req.params;
    db.all(`SELECT * FROM transactions WHERE sender_account = ? OR receiver_account = ? ORDER BY timestamp DESC`, [accountNumber, accountNumber], (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error." });
        res.json(rows);
    });
};

// 6. ADD BENEFICIARY (Customer Functionality)
exports.addBeneficiary = (req, res) => {
    const { customer_id, name, bank_name, account_number, transfer_limit } = req.body;
    db.run(`INSERT INTO beneficiaries (customer_id, name, bank_name, account_number, transfer_limit) VALUES (?, ?, ?, ?, ?)`,
        [customer_id, name, bank_name, account_number, transfer_limit], function(err) {
            if (err) return res.status(500).json({ error: "Failed to add beneficiary." });
            res.status(201).json({ message: "Beneficiary added successfully!" });
        });
};

// 7. GET MY BENEFICIARIES
exports.getBeneficiaries = (req, res) => {
    const { customerId } = req.params;
    db.all(`SELECT * FROM beneficiaries WHERE customer_id = ?`, [customerId], (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error." });
        res.json(rows);
    });
};

// 8. ATOMIC MONEY TRANSFER (Customer Functionality with strict ACID rules)
exports.transferMoney = (req, res) => {
    const { senderId, receiverAccountNumber, amount } = req.body;

    if (amount <= 0) return res.status(400).json({ error: "Transfer amount must be greater than zero." });

    // Step A: Find Sender details
    db.get(`SELECT account_number, balance FROM users WHERE id = ?`, [senderId], (err, sender) => {
        if (err || !sender) return res.status(404).json({ error: "Sender account missing." });
        if (sender.balance < amount) return res.status(400).json({ error: "Insufficient funds available." });
        if (sender.account_number === receiverAccountNumber) return res.status(400).json({ error: "Self-transfers are not allowed." });

        // Step B: Find Receiver details
        db.get(`SELECT id FROM users WHERE account_number = ?`, [receiverAccountNumber], (err, receiver) => {
            if (err || !receiver) return res.status(404).json({ error: "Receiver account number not found." });

            // ENFORCE ACID COMPLIANCE USING TRANSACTION BLOCK
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                // Debit sender
                db.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [amount, senderId]);
                
                // Credit receiver
                db.run(`UPDATE users SET balance = balance + ? WHERE account_number = ?`, [amount, receiverAccountNumber]);
                
                // Log the ledger transaction record
                db.run(`INSERT INTO transactions (sender_account, receiver_account, amount) VALUES (?, ?, ?)`, 
                    [sender.account_number, receiverAccountNumber, amount], (err) => {
                        if (err) {
                            db.run("ROLLBACK");
                            return res.status(500).json({ error: "Transaction failed. Rolled back." });
                        } else {
                            db.run("COMMIT");
                            res.json({ message: "Transfer completed successfully!" });
                        }
                    });
            });
        });
    });
};

// 9. ADMIN: VIEW ALL CUSTOMER PROFILES
exports.getAllCustomers = (req, res) => {
    db.all(`SELECT id, name, email, role, address, phone, account_number, balance FROM users WHERE role = 'CUSTOMER'`, (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error." });
        res.json(rows);
    });
};

// 10. ADMIN: VIEW ALL SYSTEM TRANSACTIONS
exports.getAllTransactions = (req, res) => {
    db.all(`SELECT * FROM transactions ORDER BY timestamp DESC`, (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error." });
        res.json(rows);
    });
};