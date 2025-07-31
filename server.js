const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sql } = require('./db'); // adjust path as needed
const { default: axios } = require('axios');
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
// const TENANT_ID = process.env.TENANT_ID
// const CLIENT_ID = process.env.CLIENT_ID
// const CLIENT_SECRET =process.env.CLIENT_SECRET

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

// app.get('/api/pbi-token', async (req, res) => {
//   console.log('➡️ Received GET request to /api/pbi-token');
//   const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

//   const params = new URLSearchParams();
//   params.append('grant_type', 'client_credentials');
//   params.append('client_id', CLIENT_ID);
//   params.append('client_secret', CLIENT_SECRET);
//   params.append('scope', 'https://analysis.windows.net/powerbi/api/.default');

//   try {
//     const response = await axios.post(url, params);
//     res.json(response.data); // access_token, expires_in, etc.
//   } catch (err) {
//     console.error("Error fetching token", err.response?.data || err.message);
//     res.status(500).json({ error: 'Failed to get token' });
//   }
// });


router.get('/api/pbi-token', async (req, res) => {
  try {
    const token = await getAccessToken();
    const data = res.json({ accessToken: token });
    res.status(201).json({ message: 'Token generated', accessToken: token });
  } catch (err) {
    console.error('Failed to get Power BI token', err);
    res.status(500).json({ error: 'Token generation failed' });
  }
});


// ✅ Start server ONCE
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
