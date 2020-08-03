const express = require('express');
const router = express.Router();
const User = require('../modals/User');
const bcrypt = require('bcryptjs');
const {
	ensureAuthenticated,
	ensureSuper,
	ensureModerateSuper,
} = require('../config/auth');
const { changeDefaultValues, getDefaultValues } = require('../utils/gsheet');

router.get('/', ensureAuthenticated, ensureModerateSuper, (req, res, next) => {
	if (req.user.access == 'super') {
		let defaultvalues;
		let errors = [];
		getDefaultValues()
			.then(
				(values) => {
					defaultvalues = values;
					return User.find();
				},
				(err) => {
					errors.push({ msg: 'Unable to fetch default values' });
				}
			)
			.then(
				(users) =>
					res.render('settings', {
						section: 'settings',
						defaultvalues,
						users,
					}),
				(err) => {
					errors.push({ msg: 'Unable to fetch users' });
				}
			)
			.finally(() => {
				if (errors.length > 0) {
					res.render('settings', {
						section: 'settings',
						settings_dval_errors : errors,
					});
				}
			});
	} else {
		res.render('settings', {
			section: 'settings',
		});
	}
});

router.post('/', ensureAuthenticated, ensureSuper, async (req, res, next) => {
	const {
		firstname,
		lastname,
		username,
		password,
		password2,
		access,
	} = req.body;
	let errors = [];
	if (
		!firstname ||
		!lastname ||
		!username ||
		!password ||
		!password2 ||
		!access
	) {
		errors.push({ msg: 'Please fill all the fields!' });
	}

	if (password.length < 6) {
		errors.push({
			msg: 'Password length should be greater than 6 characters!',
		});
	}
	if (password !== password2) {
		errors.push({ msg: 'Password does not match to the confirmed password!' });
	}

	const users = await User.find()

	if (errors.length > 0) {
		res.render('settings', {
			section: 'settings',
			innerSection : 'addUsers',
			users,
			errors,
			firstname,
			lastname,
			username,
			password,
			password2,
			access,
		});
	} else {
		User.findOne({ username }).then((user) => {
			if (user) {
				errors.push({
					msg: `Username ${username} already exists!`,
				});
				res.render('settings', {
					section: 'settings',
					innerSection : 'addUsers',
					errors,
					users,
					firstname,
					lastname,
					username,
					password,
					password2,
					access,
				});
			} else {
				const newUser = new User({
					firstname,
					lastname,
					username,
					password,
					access,
				});

				bcrypt.genSalt(10, (err, salt) =>
					bcrypt.hash(newUser.password, salt, (err, hash) => {
						if (err) {
							throw err;
						}

						newUser.password = hash;
						newUser
							.save()
							.then((user) => User.find())
							.then((users) =>
								res.render('settings', {
									section: 'settings',
									innerSection : 'addUsers',
									users,
									success: [
										{
											msg: `User ${newUser.username} registered successfully!`,
										},
									],
								})
							)
							.catch((err) => console.log(err));
					})
				);
			}
		});
	}
});

router.post(
	'/defaultvalues',
	ensureAuthenticated,
	ensureModerateSuper,
	(req, res, next) => {
		let errors = [];
		let data = req.body.data;
		for (var key in data) {
			if (data[key] == '') {
				errors.push([key, 'Empty values not allowed']);
			}
			const num = parseInt(data[key]);
			if (num == 'NaN') {
				errors.push([key, 'Only positive intergers allowed!']);
			}
			if (num < 0) {
				errors.push([key, 'Negative integers not allowed']);
			}

			data[key] = num;
		}

		if (errors.length > 0) {
			console.log(errors);
			res.send({ error: errors });
		} else {
			changeDefaultValues(data)
				.then(
					(updatedValues) => res.send({ values: updatedValues }),
					(err) => {
						throw err;
					}
				)
				.catch((err) => res.send({ error: [err.message] }));
		}
	}
);

module.exports = router;
