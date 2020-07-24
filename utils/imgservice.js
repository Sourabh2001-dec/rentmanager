var fs = require('fs');
var text2png = require('text2png');
const path = require('path');
const randomstring = require('randomstring');
var fontPath = __dirname + '/fonts/Eczar-Regular.ttf';
function genImage(data) {
	const response = [];

	const folder = randomstring.generate(7);
	const folderpath = path.join(__dirname, './tempImage/' + folder);
	if (!fs.existsSync(folderpath)) {
		fs.mkdirSync(folderpath);
    }
    else{
        while(true){
            folder = randomstring.generate(7);
            folderpath = path.join(__dirname, './tempImage/' + folder);
            if (!fs.existsSync(folderpath)) {
                fs.mkdirSync(folderpath);
                return true
            }
        }
    }

	data.forEach((tenant) => {
		const string = `तारीख	        : ${tenant.date}\nखोली क्रमांक	: ${tenant.room_no}\nयुनिट	        : ${tenant.elec_units}\nलाईट बील	        : Rs. ${tenant.elec_bill}\nपाणी बील	        : Rs. ${tenant.water_bill}\nखोलीचे भाडे	: Rs. ${tenant.rent}\nइतर	                : Rs. ${tenant.other}\nटोटल	        : Rs. ${tenant.total}`;
		const img = text2png(string, {
			font: '30px Eczar',
			debug: true,
			localFontPath: fontPath,
			localFontName: 'Eczar',
			color: '#444444',
			backgroundColor: 'white',
			lineSpacing: 10,
			padding: 20,
			borderColor: '#444444',
			borderWidth: 2,
			output: 'buffer',
		});

		fs.writeFileSync(folderpath + `/${tenant.room_no}.png`, img);
		response.push(folderpath + `/${tenant.room_no}.png`);
	});
	return response;
}

// const date = new Date();

// const raw = [
// 	{
// 		date: date.toDateString(),
// 		room_no: 1,
// 		elec_units: 123,
// 		elec_bill: 123,
// 		water_bill: 123,
// 		rent: 123,
// 		other: 123,
// 		total: 123,
// 	}
// ];

// var images = genImage(raw)
module.exports = genImage;
