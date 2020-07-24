const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const User = require('../modals/User');
const bcrypt = require('bcryptjs');

router.get('/changepassword', ensureAuthenticated, (req, res) => {
	res.render('changePassword', {
		section: '',
	});
});

router.post('/changepassword', ensureAuthenticated, async (req, res) => {
	let { curr_password, new_password, conf_new_password } = req.body;
	const { username, password } = req.user;
	let errors = [];

	if (!curr_password || !new_password || !conf_new_password) {
		errors.push({ msg: 'Please fill all the fields!' });
	}

	bcrypt.compare(curr_password, password, (err, isMatch) => {
		if (err) console.log('password compare', err);
		if (!isMatch) {
			errors.push({
				msg: 'Please enter correct current password!',
			});
		}
	});

	if (new_password !== conf_new_password)
		errors.push({
			msg: 'New password does not match to the confirmed password!',
		});

	if (curr_password.length < 6)
		errors.push({
			msg: 'Password length should be greater than 6 charachters!',
		});

	if (errors.length > 0) {
		res.render('changePassword', {
			section: '',
			errors,
		});
		return;
	}

	let newPasshash = '';

	try {
		newPasshash = await new Promise((resolve, reject) => {
			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(new_password, salt, (err, hash) => {
					if (err) {
						errors.push({ msg: err.message });
						reject(err);
					}
					resolve(hash);
				});
			});
		});
	} catch (error) {
		res.render('changePassword', {
			section: '',
			errors: [{ msg: error.message }],
		});
		return;
	}

	if (errors.length > 0) {
		res.render('changePassword', {
			section: '',
			errors,
		});
		return;
	}

	if (newPasshash !== '') {
		try {
			let user = await User.findOneAndUpdate(
				{ username },
				{ password: newPasshash }
			);
			await user.save();

			res.render('changePassword', {
				section: '',
				success: [{ msg: 'Password changed successfully!' }],
			});
		} catch (error) {
			res.render('changePassword', {
				section: '',
				errors: [{ msg: error.message }],
			});
		}
	}
});

module.exports = router;
