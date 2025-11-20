const path = require('path');
const express = require('express');
require('dotenv').config();

const app = express();
const routes = require('./routes');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/', routes);

app.get('/health', (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`YFN Space running at ${process.env.BASE_URL || 'http://localhost:'+port}`);
});
