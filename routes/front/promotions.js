const express = require('express');
const router = express.Router();

const {sendData} = require('../../src/helpers.js');

router.get('/', async (req, res) => {
	//get all promotions with degree from this organism (organism is attached to promotion and not degree)
	let promotions = await sendData({
		"pipeline": [
			{
				"$lookup": {
					"from": "degrees",
					"localField": "degree",
					"foreignField": "_id",
					"as": "degree"
				},
			},
			{
				"$unwind": "$degree"
			},
			{
				"$match": {
					"organism": {
						"$oid": req.session.user.organism
					}
				}
			}
		],
	}, 'promotions', 'aggregate');
	res.render('front/promotions/index.html.twig', {
		promotions: promotions.data.documents
	});
});

router.get('/new', async (req, res) => {
	let degrees = await sendData({}, 'degrees', 'find');
	res.render('front/promotions/show.html.twig', {
		degrees: degrees.data.documents
	});
});

router.post('/new', async (req, res) => {
	await sendData({
		"documents": [
			{
				"name": req.body.name,
				"degree": {
					"$oid": req.body.degree
				},
				"start": new Date(req.body.start),
				"end": new Date(req.body.end),
				"organism": {
					"$oid": req.session.user.organism
				}
			}
		]
	}, 'promotions', 'insertMany');

	res.redirect('/promotions');
});

router.get('/:id', async (req, res) => {
	let promotion = await sendData({
		"filter": {
			"_id": {
				"$oid": req.params.id
			}
		}
	}, 'promotions', 'findOne');

	let degrees = await sendData({}, 'degrees', 'find');

	res.render('front/promotions/show.html.twig', {
		promotion: promotion.data.document,
		degrees: degrees.data.documents
	});
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
				"degree": {
					"$oid": req.body.degree
				},
				"start": new Date(req.body.start),
				"end": new Date(req.body.end),
			}
		}
	}, 'promotions', 'updateOne');

	res.redirect('/promotions');
});

router.get('/:id/delete', async (req, res) => {
	await sendData({
		"filter": {
			"_id": {
				"$oid": req.params.id
			}
		}
	}, 'promotions', 'deleteOne');

	res.redirect('/promotions');
});

router.get('/:id/students', async (req, res) => {
	//students of this promotion can be found by looking in promotions_students collection
	let students = await sendData({
		"pipeline": [
			{
				"$lookup": {
					"from": "students",
					"localField": "student",
					"foreignField": "_id",
					"as": "student"
				},
			},
			{
				"$unwind": "$student"
			},
			{
				"$match": {
					"promotion": {
						"$oid": req.params.id
					}
				}
			}
		],
	}, 'promotions_students', 'aggregate');

	let promotion = await sendData({
		"filter": {
			"_id": {
				"$oid": req.params.id
			}
		}
	}, 'promotions', 'findOne');

	res.render('front/students/index.html.twig', {
		students: students.data.documents,

		promotion: promotion.data.document
	});
});

module.exports = router;