const express = require('express');
const router = express.Router();
const { getSheets, createSheet, getDefaultValues } = require('../utils/gsheet');
const { ensureAuthenticated, ensureModerateSuper } = require('../config/auth');

function isANumber(str) {
	return !/\D/.test(str);
}

const calAndInsert = async (lastData, data, sheetToInsert) => {
	if (lastData.status) {
		const lastValues = lastData.rows;
		let valid_flag = true;
		let newMonth = lastValues.map((month) => {
			let room = month.room_no;
			// data -> current data
			// lastValues -> prev month data
			if (data[`r${room}-elec-reading`] - parseInt(month.elec_reading) < 0) {
				valid_flag = false;
				throw new Error('Readings are invalid!');
			}

			// got rid of invalid readings
			let creationDate = new Date().toString();
			let temp = {
				date: creationDate,
				room_no: room,
				elec_units: '',
				elec_bill: '',
				elec_reading: data[`r${room}-elec-reading`],
				water_bill: data[`r${room}-water-cost`],
				rent: data[`r${room}-rent-cost`],
				other: data[`r${room}-other`],
				total: '',
			};

			temp.elec_units = temp.elec_reading - parseInt(month.elec_reading);
			temp.elec_bill = temp.elec_units * data[`r${room}-elec-rate`];
			temp.total = temp.elec_bill + temp.water_bill + temp.rent + temp.other;

			return temp;
		});

		if (valid_flag) {
			return sheetToInsert.addNewMonth(newMonth);
		} else {
			throw new Error('Readings error!');
		}
	}
};

router.get('/', ensureAuthenticated,ensureModerateSuper, (req, res, next) => {
	getDefaultValues()
		.then((values) => {
			return res.render('generate', {
				section: 'generation',
				defaults: values,
			});
		})
		.catch((err) => console.log(err.message));
});

router.post('/', ensureAuthenticated,ensureModerateSuper, (req, res, next) => {
	let errors = [];
	const data = req.body;

	let validation_flag = true;

	// Check for empty and non-number values
	for (let i = 1; i < 7; i++) {
		if (data[`r${i}-elec-reading`] == '') {
			validation_flag = false;
			return res.render('generate', {
				section: 'generation',
				data,
				errors: [{ msg: 'Please fill all the fields' }],
			});
		}
		if (!isANumber(data[`r${i}-elec-reading`])) {
			validation_flag = false;
			return res.render('generate', {
				section: 'generation',
				data,
				errors: [{ msg: 'Please enter only numbers in the fields' }],
			});
		}
	}
	if (validation_flag) {
		// parsing values as int
		for (var key in data) {
			data[key] = parseInt(data[key]);
		}

		// primary data validation passed
		let year = new Date().getFullYear().toString();
		var sheet = null;
		var allSheets = null;
		getSheets()
			.then(
				(sheets) => {
					allSheets = sheets;
					if (sheets[year]) {
						sheet = sheets[year];
						sheets[year]
							.getLastMonth()
							.then(
								(lastData) => calAndInsert(lastData, data, sheet),
								(err) => {
									throw err;
								}
							)
							.then(
								(resp) =>
									res.render('generate', {
										section: 'generation',
										success: [{ msg: 'Bill generated' }],
									}),
								(err) => {
									throw err;
								}
							)
							.catch((err) =>
								res.render('generate', {
									section: 'generation',
									data,
									errors: [{ msg: err.message }],
								})
							);
						return;
					} else {
						createSheet(year)
							.then(
								(newsheet) => {
									sheet = newsheet;
									let lastYearSheet = allSheets[`${parseInt(year) - 1}`];
									if (lastYearSheet) {
										return lastYearSheet.getLastMonth();
									}
								},
								(err) => {
									throw new Error('Unable to fetch last Year data');
								}
							)
							.then(
								(lastMonth) => calAndInsert(lastMonth, data, sheet),
								(err) => {
									throw new Error(
										"Unable to fetch last year's last month's data. Please try again"
									);
								}
							)
							.then(
								(resp) =>
									res.render('generate', {
										section: 'generation',
										success: [{ msg: 'Bill generated' }],
									}),
								(err) => {
									throw err;
								}
							)
							.catch((err) =>
								res.render('generate', {
									section: 'generation',
									data,
									errors: [{ msg: err.message }],
								})
							);
					}
				},
				(err) => {
					throw new Error('Unable to get sheets');
				}
			)
			.catch((err) =>
				res.render('generate', {
					section: 'generation',
					data,
					errors: [{ msg: err.message }],
				})
			);
	}
});

module.exports = router;
