const { GoogleSpreadsheet } = require('google-spreadsheet');

/* -------------------------------------------------------------------------- */
// credentials for the google api
/* -------------------------------------------------------------------------- */

let creds = null;
if (process.env.NODE_ENV === 'production') {
	creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
} else {
	creds = require('../credentials.json').GOOGLE_SERVICE_ACCOUNT;
}

/* -------------------------------------------------------------------------- */
// Function to get the lastmonth of a sheet to which the function is binded
/* -------------------------------------------------------------------------- */

async function getLastMonth() {
	const sheet = this.sheet;
	const numRows = (await sheet.rowCount) - 7;
	if (numRows < 0) return { status: 0 };
	const rows = await sheet.getRows({ offset: numRows });
	const data = {
		status: 1,
		date: new Date(rows[0].date).toDateString(),
		rows: rows.map((row) => ({
			room_no: row.room_no,
			elec_units: row.elec_units,
			elec_bill: row.elec_bill,
			elec_reading: row.elec_reading,
			water_bill: row.water_bill,
			rent: row.rent,
			other: row.other,
			total: row.total,
		})),
	};
	return data;
}

/* -------------------------------------------------------------------------- */
/* function to add a new month data to the sheet to which the function is binded */
/* -------------------------------------------------------------------------- */

async function addNewMonth(data) {
	const sheet = this.sheet;
	const prevRowCount = await sheet.rowCount;
	const prevColCount = await sheet.columnCount;
	const newParams = {
		rowCount: prevRowCount + data.length,
		columnCount: prevColCount,
	};
	await sheet.resize(newParams).then(
		(resp) => {
			sheet.addRows(data).then(
				(res) => ({ status: 1, message: 'Data Added', data: data }),
				(err) => ({ status: 0, message: 'Unable to add data' })
			);
		},
		(err) => ({ status: 0, message: 'Unable to add Data' })
	);
}

/* -------------------------------------------------------------------------- */
/* function to get full year data of a sheet to which thw function is binded */
/* -------------------------------------------------------------------------- */

async function getFullYear() {
	const sheet = this.sheet;
	const rows = await sheet.getRows();
	const response = [];
	for (var i = 0; i < rows.length; i = i + 6) {
		const date = new Date(rows[i].date).toDateString();
		const month = {
			id: i,
			date,
			month: [],
		};
		for (var j = i; j < i + 6; j++) {
			const row = rows[j];
			month.month.push({
				room_no: row.room_no,
				elec_units: row.elec_units,
				elec_bill: row.elec_bill,
				elec_reading: row.elec_reading,
				water_bill: row.water_bill,
				rent: row.rent,
				other: row.other,
				total: row.total,
			});
		}
		response.push(month);
	}
	return response;
}

/* -------------------------------------------------------------------------- */
/*                       function to load a spreadsheet                       */
/* -------------------------------------------------------------------------- */

const loadDocs = async () => {
	const doc = new GoogleSpreadsheet(
		'1i-9dsh2Un6o0ZMWbZQIEvfWUkoeHabf0nXtvyMuo1sw'
	);

	await doc.useServiceAccountAuth(creds);

	await doc.loadInfo();

	return doc;
};

/* -------------------------------------------------------------------------- */
/*        function to get all sheets in a object with title as the keys       */
/* -------------------------------------------------------------------------- */

async function getSheets() {
	const doc = await loadDocs();

	const raw_sheets = doc.sheetsByIndex;
	const sheets = {};
	raw_sheets.forEach((sheet) => {
		sheets[sheet.title] = { sheet: sheet };
		sheets[sheet.title].getLastMonth = getLastMonth;
		sheets[sheet.title].addNewMonth = addNewMonth;
		sheets[sheet.title].getFullYear = getFullYear;
	});
	return sheets;
}

/* ---------------------------------------------------------------------------------------------- */
/*            function to create a new worksheet with the given title in a spreadsheet            */
/* ---------------------------------------------------------------------------------------------- */

async function createSheet(title) {
	const doc = await loadDocs();

	const newSheet = await doc.addSheet();

	await newSheet.updateProperties({ title: title });

	const titles = [
		'date',
		'room_no',
		'elec_reading',
		'elec_units',
		'elec_bill',
		'water_bill',
		'rent',
		'other',
		'total',
	];

	await newSheet.setHeaderRow(titles);

	await newSheet.resize({ rowCount: 1, columnCount: titles.length });
	const sheets = { sheet: newSheet };
	sheets.addNewMonth = addNewMonth;
	return sheets;
}

/* ---------------------------------------------------------------------------------------------- */
/*                   function to get default costs from the "default" worksheet                   */
/* ---------------------------------------------------------------------------------------------- */

async function getDefaultValues() {
	let sheets = await getSheets();

	let values = await sheets['default'].sheet.getRows({ limit: 1 });

	values = values[0];

	let response = {};

	for (let i = 1; i < 7; i++) {
		response[`r${i}-elec-rate`] = values[`r${i}-elec-rate`];
		response[`r${i}-water-cost`] = values[`r${i}-water-cost`];
		response[`r${i}-rent-cost`] = values[`r${i}-rent-cost`];
	}

	return response;
}

/* ---------------------------------------------------------------------------------------------- */
/*               function to change the default values in the "default" spreadsheet               */
/* ---------------------------------------------------------------------------------------------- */

async function changeDefaultValues(newValues) {
	let allSheets = await getSheets();
	let defSheet = allSheets['default'];
	let defValues = await defSheet.sheet.getRows();
	defValues = defValues[0];
	let response = [];
	for (var key in newValues) {
		if (defValues[key]) {
			defValues[key] = newValues[key];
			response.push([key,newValues[key]]);
		}
	}
	await defValues.save();
	return response;
}

/* ---------------------------------------------------------------------------------------------- */
/*                             exported object with all the functions                             */
/* ---------------------------------------------------------------------------------------------- */

const gsheet = {
	getSheets: null,
	createSheet: null,
	getDefaultValues: null,
	changeDefaultValues: null,
};

gsheet.getSheets = getSheets;
gsheet.createSheet = createSheet;
gsheet.getDefaultValues = getDefaultValues;
gsheet.changeDefaultValues = changeDefaultValues;

module.exports = gsheet;
