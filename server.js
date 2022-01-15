const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const mongoose = require('mongoose');
const compression = require("compression")

// Passport config
require('./config/passport')(passport);

let db;
if (process.env.NODE_ENV == 'production') {
	db = process.env.MONGODB;
} else {
	db = require('./credentials.json').mongoDB;
}

mongoose
	.connect(db, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
	})
	.then(() => {
		if (process.env.NODE_ENV !== 'production') {
			console.log('MongoDB connected ...');
		}
	})
	.catch((err) => console.log(err));

const port = process.env.PORT || 3000;
const app = express();

app.set('view engine', 'ejs');

app.use(compression())

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

// Express session
app.use(
	session({
		secret: 'cateatsthefish',
		resave: true,
		saveUninitialized: true,
	})
);

// Passport Middleware

app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function (req, res, next) {
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	res.locals.user = req.user || '';
	next();
});

app.use('/', require('./routes/login.js'));

app.use('/dashboard', require('./routes/dashboard.js'));

app.use('/generation', require('./routes/generate.js'));

app.use('/account', require('./routes/account.js'));

app.use('/settings', require('./routes/settings'));

app.use('/yeardata', require('./routes/yeardata.js'));

app.use('/imgservice', require('./routes/imgservice.js'));

app.get('/logout', (req, res, next) => {
	req.logOut();
	req.flash('success_msg', 'You are successfully logged out.');
	res.redirect('/');
});

app.listen(port, () => {
	if (process.env.NODE_ENV !== 'production') {
		console.log('Server running on port ' + port);
		console.log('http://localhost:' + port);
	}
});
