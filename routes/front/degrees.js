const express = require('express');
const router = express.Router();

const {sendData} = require('../../src/helpers.js');

router.get('/', async (req, res) => {
	let degrees = await sendData({}, 'degrees');
	res.render('front/degrees/index.html.twig', {
		degrees: degrees.data.documents
	});
});

router.get('/new', async (req, res) => {
	res.render('front/degrees/show.html.twig');
});

router.post('/new', async (req, res) => {
	await sendData({
		"documents": [
			{
				"name": req.body.name,
				"description": req.body.description,
			}
		]
	}, 'degrees', 'insertMany');

	res.redirect('/degrees');
});

router.get('/:id', async (req, res) => {
	let degree = await sendData({
		"filter": {
			"_id": {
				"$oid": req.params.id
			}
		}
	}, 'degrees', 'findOne');

	res.render('front/degrees/show.html.twig', {degree: degree.data.document});
});

router.post('/:id', async (req, res) => {
	await sendData({
		"filter": {
			"_id": {
				"$oid": req.params.id
			}
		},
		"update": {
			"$set": {
				"name": req.body.name,
				"description": req.body.description,
			}
		}
	}, 'degrees', 'updateOne');

	res.redirect('/degrees');
});

router.get('/:id/delete', async (req, res) => {
	await sendData({
		"filter": {
			"_id": {
				"$oid": req.params.id
			}
		}
	}, 'degrees', 'deleteOne');

	res.redirect('/degrees');
});

module.exports = router;