const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const auth = require('./auth');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000; // <-- THIS IS IMPORTANT for Render!

app.use(session({
  secret: 'supersecretkey', // Replace with a strong secret in production
  resave: false,
  saveUninitialized: true
}));

// Routes
app.get('/', (req, res) => {
  if (req.session.isPatron) {
    res.send('<h1>Welcome to the Portal 🎉</h1><p><a href="/logout">Logout</a></p>');
  } else {
    res.send('<h1>Access Denied ❌</h1><p><a href="/login">Login with Patreon</a></p>');
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
      res.send('<h1>Membership Required</h1><p><a href="/login">Try Again</a></p>');
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
  console.log(`Portal running on http://localhost:${PORT}`);
});
