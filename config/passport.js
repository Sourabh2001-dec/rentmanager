const LocalStrategy = require('passport-local');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

//Load User Modal
const User = require('../modals/User');
const passport = require('passport');

module.exports = (passport) => {
	passport.use(
		new LocalStrategy(
			{
				usernameField: 'username',
			},
			(username, password, done) => {
				User.findOne({ username })
					.then((user) => {
						//Match User
						if (!user) {
							return done(null, false, {
								message: 'That username is not registered!',
							});
						}

						// Match password
						bcrypt.compare(password, user.password, (err, isMatch) => {
							if (err) console.log(err);
							if (isMatch) {
								done(null, user);
							} else {
								done(null, false, { message: 'Password incorrect!' });
							}
						});
					})
					.catch((err) => console.log(err));
			}
		)
    );
    
    passport.serializeUser(function(user, done) {
        done(null, user.id);
      });
      
      passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
          done(err, user);
        });
      });
};
