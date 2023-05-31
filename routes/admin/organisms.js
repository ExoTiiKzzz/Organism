const { sendData } = require('../../src/helpers.js');

const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
	let data = {};
	if (req.query.q) {
		data.filter = {
			name: {
				$regex: req.query.q,
				$options: 'i'
			}
		}
	}
	let organisms = await sendData(data, 'organisms', 'find');
	res.render('admin/organisms/index.html.twig', {
		organisms: organisms.data.documents,
		search: req.query.q,
	});
});

router.get('/new', async (req, res) => {
	res.render('admin/organisms/show.html.twig');
});

router.post('/new', async (req, res) => {
	//create new organism
	let organism = await sendData({
		"documents": [
			{
				"name": req.body.name,
				"email": req.body.email,
			}
		]
	}, 'organisms', 'insertMany');
	res.redirect('/admin/organisms/' + organism.data.insertedIds[0]);
});

router.get('/:id', async (req, res) => {
	//get one organism
	let organism = await sendData({
		"filter": {
			"_id": {
				"$oid": req.params.id
			}
		}
	}, 'organisms', 'findOne');

	res.render('admin/organisms/show.html.twig', {organism: organism.data.document });
});

router.post('/delete', async (req, res) => {
	//delete organisms
	await sendData({
		"filter": {
			"_id": {
				"$in": req.body.organisms?.map(id => {
					return {"$oid": id};
				})
			}
		}
	}, 'organisms', 'deleteMany');

	res.redirect('/admin/organisms');
});

router.post('/:id', async (req, res) => {
	//update organism
	await sendData({
		"filter": {
			"_id": {
				"$oid": req.params.id
			}
		},
		"update": {
			"$set": {
				"name": req.body.name,
				"email": req.body.email,
			}
		}
	}, 'organisms', 'updateOne');

	res.redirect('/admin/organisms/' + req.params.id);
});

router.get('/:id/delete', async (req, res) => {
	//delete organism
	await sendData({
		"filter": {
			"_id": {
				"$oid": req.params.id
			}
		}
	}, 'organisms', 'deleteOne');

	res.redirect('/admin/organisms');
});

module.exports = router;