const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const auth = require('./auth');
const path = require('path');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (for logo image)
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'supersecretkey', // Replace for production
  resave: false,
  saveUninitialized: true
}));

// Access Denied / Login Page
const accessDeniedHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>NextStepFX Portal</title>
  <style>
    body {
      background-color: #000;
      color: #fff;
      font-family: sans-serif;
      text-align: center;
      padding-top: 80px;
    }
    img {
      width: 200px;
      margin-bottom: 40px;
    }
    a.login {
      background: #71e9df;
      padding: 12px 24px;
      color: #000;
      text-decoration: none;
      font-weight: bold;
      border-radius: 6px;
      transition: 0.3s;
    }
    a.login:hover {
      background: #ffffff;
    }
  </style>
</head>
<body>
  <img src="/logo.png" alt="NextStepFX Logo">
  <h1>Access Denied</h1>
  <p>You must be a member to access this portal.</p>
  <a href="/login" class="login">Login with Patreon</a>
</body>
</html>
`;

// Logged-in Portal Page
const portalHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Welcome | NextStepFX Academy</title>
  <style>
    body {
      background-color: #ffffff;
      color: #000000;
      font-family: sans-serif;
      text-align: center;
      padding-top: 60px;
    }
    img {
      width: 150px;
      margin-bottom: 20px;
    }
    .dashboard {
      margin-top: 40px;
    }
    a.logout {
      display: inline-block;
      margin-top: 20px;
      background: #000;
      color: #fff;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 5px;
    }
    a.logout:hover {
      background: #71e9df;
      color: #000;
    }
  </style>
</head>
<body>
  <img src="/logo.png" alt="NextStepFX Logo">
  <h1>Welcome back, trader!</h1>
  <div class="dashboard">
    <p>This is your private academy portal.</p>
    <p>[Placeholder for videos, downloads, or lessons]</p>
  </div>
  <a href="/logout" class="logout">Logout</a>
</body>
</html>
`;

app.get('/', (req, res) => {
  if (req.session.isPatron) {
    res.send(portalHTML);
  } else {
    res.send(accessDeniedHTML);
  }
});

app.get('/login', (req, res) => {
  res.redirect(auth.getPatreonAuthURL());
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.send('Missing code.');

  try {
    const isPatron = await auth.checkPatreonMembership(code);
    req.session.isPatron = isPatron;

    if (isPatron) {
      res.redirect('/');
    } else {
      res.send(accessDeniedHTML);
    }
  } catch (error) {
    console.error(error);
    res.send('Authentication failed.');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Portal running on port ${PORT}`);
});
