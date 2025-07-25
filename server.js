const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sql } = require('./db'); // adjust path as needed
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());



// configuration for sql server
const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: true, // use true for azure sql
        enableArithAbort: true
    },
    port: parseInt(process.env.DB_PORT)
};


// ✅ GET: fetch all users
app.get('/api/users', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM Users');
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Database error');
  }
});

// ✅ POST: insert a new user
app.post('/api/auth/register', async (req, res) => {
  console.log('➡️ Received POST request to /api/usersInput');

  try {
    const { username, email, passwordHash } = req.body;

    console.log('📥 Request Body:', req.body);

    if (!username || !email || !passwordHash) {
      console.warn('⚠️ Missing fields in request body');
      return res.status(400).json({ error: 'All fields are required' });
    }

    console.log('✅ All required fields received:');
    console.log('👤 Username:', username);
    console.log('📧 Email:', email);
    console.log('🔐 Password Hash:', passwordHash);

    console.log('🛠️ config',config);

    await sql.connect(config);
    console.log('🛠️ Connected to SQL Server');

    await sql.query`
      INSERT INTO Users (Username, Email, PasswordHash, CreatedAt, LastLogin)
      VALUES (${username}, ${email}, ${passwordHash}, GETDATE(), NULL)
    `;

    console.log('✅ User inserted successfully into database');

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('❌ Insert error:', err);
    res.status(500).json({ error: 'Server error while inserting user' });
  }
});


// POST /api/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    await sql.connect(config);
    const result = await sql.query`
      SELECT * FROM Users WHERE Email = ${email}
    `;

    const user = result.recordset[0];

    if (!user) {
      return res.status(404).json({ error: "User does not exist" });
    }

    if (user.PasswordHash !== password) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // Optionally update login timestamp
    await sql.query`
      UPDATE Users SET LastLogin = GETDATE() WHERE Email = ${email}
    `;

    res.json({ message: "Login successful", token: "user_token_here" });

  } catch (err) {
    console.error("Login error", err);
    res.status(500).json({ error: "Server error during login" });
  }
});


// ✅ Start server ONCE
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
