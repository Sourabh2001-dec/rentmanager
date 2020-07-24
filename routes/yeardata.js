const express = require('express');
const router = express.Router();
const { getSheets } = require('../utils/gsheet');
const { ensureAuthenticated } = require('../config/auth');

function isANumber(str) {
	return !/\D/.test(str);
}

router.get('/', ensureAuthenticated, (req, res, next) => {
	let year = new Date().getFullYear().toString();
	if (req.query.year && isANumber(req.query.year)) {
		year = req.query.year;
	} else if (req.query.year && !isANumber(req.query.year)) {
		res.statusCode = 404;
		return res.send({ message: 'Oops! Year is invalid.' });
	}

	let sheet;
	let options = [];

	getSheets()
		.then(
			(sheets) => {
				for (var key in sheets) {
					isANumber(key) && options.push(key);
				}
				if (sheets[year]) sheet = sheets[year];
				else throw new Error('Data for given year not found');
			},
			(err) => {
				throw err;
			}
		)
		.then(() => sheet.getFullYear())
		.then(
			(fullYearData) =>
				res.send({
					data: fullYearData.reverse(),
					options: options.reverse(),
					selection: year,
				}),
			(err) => {
				throw err;
			}
		)
		.catch((err) => res.send({ message: err.message }));
});

module.exports = router;
