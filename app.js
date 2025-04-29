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
  <title>NextStepFXAcademy Portal</title>
  <style>
    body {
      background-color: #ffffff;
      color: #000;
      font-family: sans-serif;
      text-align: center;
      padding-top: 80px;
    }
    img {
      width: 200px;
      margin-bottom: 40px;
    }
    a.login {
      display: inline-block;
      margin-top: 20px;
      background: #000;
      color: #fff;
      padding: 10px 20px;
      text-decoration: none;
      font-weight: bold;
      border-radius: 5px;
      transition: 0.3s;
    }
    a.login:hover {
      background: #71e9df;
      color: #000;
    }
  </style>
</head>
<body>
  <img src="/logo.png" alt="NextStepFXAcademy Logo">
  <h1>Access Denied</h1>
  <p>You must have an active <strong>NextStep Premium Access</strong> membership to use this portal.</p>
  <a href="/login" class="login">Login with Patreon</a>
</body>
</html>
`;

// Logged-in Dashboard Page
const portalHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>NextStepFXAcademy Portal</title>
  <style>
    body {
      background-color: #ffffff;
      color: #000;
      font-family: 'Arial', sans-serif;
      text-align: center;
      padding: 30px;
    }
    img {
      width: 150px;
      margin-bottom: 20px;
    }
    h1 {
      margin-bottom: 40px;
    }
    .dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      max-width: 800px;
      margin: 0 auto;
      margin-top: 30px;
    }
    .card {
      background: #71e9df;
      padding: 20px;
      border-radius: 10px;
      color: #000;
      font-weight: bold;
      text-decoration: none;
      transition: background 0.3s, color 0.3s;
    }
    .card:hover {
      background: #000;
      color: #fff;
    }
    a.logout {
      display: inline-block;
      margin-top: 40px;
      background: #000;
      color: #fff;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 5px;
      transition: 0.3s;
    }
    a.logout:hover {
      background: #71e9df;
      color: #000;
    }
  </style>
</head>
<body>
  <img src="/logo.png" alt="NextStepFXAcademy Logo">
  <h1>Welcome to NextStepFXAcademy!</h1>

  <div class="dashboard">
    <a href="/courses" class="card">📚 Courses</a>
    <a href="/downloads" class="card">📥 Downloads</a>
    <a href="/support" class="card">💬 Support</a>
    <a href="/account" class="card">⚙️ My Account</a>
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

// Protected Pages
const generateSimplePage = (title, message) => `
<html>
<head>
  <title>${title} | NextStepFXAcademy</title>
  <style>
    body { font-family: sans-serif; padding: 40px; background: #ffffff; color: #000; text-align: center; }
    a { display: inline-block; margin-top: 20px; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
    a:hover { background: #71e9df; color: #000; }
  </style>
</head>
<body>
  <h1>${message}</h1>
  <a href="/">← Back to Dashboard</a>
</body>
</html>
`;

app.get('/courses', (req, res) => {
  if (!req.session.isPatron) return res.redirect('/');
  res.send(generateSimplePage('Courses', '📚 Your Courses Area Coming Soon'));
});

app.get('/downloads', (req, res) => {
  if (!req.session.isPatron) return res.redirect('/');
  res.send(generateSimplePage('Downloads', '📥 Download Resources Coming Soon'));
});

app.get('/support', (req, res) => {
  if (!req.session.isPatron) return res.redirect('/');
  res.send(generateSimplePage('Support', '💬 Support Contact Form Coming Soon'));
});

app.get('/account', (req, res) => {
  if (!req.session.isPatron) return res.redirect('/');
  res.send(generateSimplePage('My Account', '⚙️ Account Details Area Coming Soon'));
});

app.listen(PORT, () => {
  console.log(`Portal running on port ${PORT}`);
});
