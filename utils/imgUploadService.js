const fs = require('fs');
const request = require('request-promise');
let imgbb_key;
if(process.env.NODE_ENV == "production"){
	imgbb_key = process.env.IMGBB_KEY
}
else{
	imgbb_key = require('../credentials.json').imgbb_key
}

async function imageUpload(path) {
	const uploadOptions = {
		url: 'https://api.imgbb.com/1/upload',
		formData: {
			image: fs.createReadStream(path),
			key: imgbb_key,
			expiration: 60,
		},
	};

	//upload the file
	const link = await request.post(uploadOptions).then(
		(body) => {
			const response = JSON.parse(body);
            return response.data.url;
		},
		(err) => ({
			status: 0,
		})
    );
    
    return link
}

module.exports = imageUpload;
