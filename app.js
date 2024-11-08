const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('public'));


// Set EJS as templating engine
app.set('view engine', 'ejs');

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'PokerDB',
  password: '*****',
  port: 5432,
});

// Routes
const indexRouter = require('./routes/index');
const pokerRouter = require('./routes/poker')(pool);

app.use('/', indexRouter);
app.use('/poker', pokerRouter);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}/`);
});
