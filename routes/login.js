const express = require('express');
const router = express.Router();
const passport = require('passport');

router.get('/', (req, res, next) => {
	res.render('index');
});

router.post('/', (req, res, next) => {
	let redirect = '/dashboard';
	if (req.query.from) {
		redirect = req.query.from;
	}
	passport.authenticate('local', {
		successRedirect: redirect,
		failureRedirect: '/',
		failureFlash: true,
	})(req, res, next);
});

module.exports = router;
