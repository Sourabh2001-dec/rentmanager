const express = require('express');
const router = express.Router();
const genImage = require('../utils/imgservice');
const imgUpload = require('../utils/imgUploadService');
const fs = require('fs')
const path = require('path')
const { ensureAuthenticated } = require('../config/auth');

async function upAndLink(data) {
	const locs = genImage(data);
	// const links = await Promise.all(
	// 	locs.map(async (link) => await imgUpload(link))
	// );
	// fs.rmdir(path.join(locs[0], '../'), { recursive: true }, (err) => {
	// 	if (err) {
	// 		throw err;
	// 	}
	// });
	return locs;
}

router.post('/',ensureAuthenticated, (req, res, next) => {
	const data = req.body.data;
	upAndLink(data).then((links) => res.send({ links: links })).catch(err => res.send({error : err.message}));
});

module.exports = router;
