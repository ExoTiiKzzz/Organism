const express = require('express');
const router = express.Router();

const {sendData} = require('../../src/helpers.js');
const bcrypt = require("bcrypt");

router.get('/', async (req, res) => {
	let data = {
		pipeline: [
			{
				$lookup: {
					from: "organisms",
					localField: "organism",
					foreignField: "_id",
					as: "organism"
				},
			},
			{
				$set: {
					organism: {
						$first: '$organism'
					}
				}
			},
		]
	};

	if (req.query.q) {
		data.pipeline.push({
			$match: {
				$or: [
					{
						username: {
							$regex: req.query.q,
							$options: 'i'
						}
					},
					{
						'organism.name': {
							$regex: req.query.q,
							$options: 'i'
						}
					},
				]
			}
		});
	}

	let users = await sendData(data, 'users', 'aggregate', {});
	res.render('admin/index.html.twig', {
		users: users.data.documents,
		search: req.query.q,
	});
});

router.get('/new', async (req, res) => {
	let organisms = await sendData({}, 'organisms', 'find');
	res.render('admin/users/show.html.twig', {
		organisms: organisms.data.documents,
	});
});

router.post('/new', async (req, res) => {
	//create new user
	const { image } = req.files;

	let imageFile = '';

	if (image) {
		//check if image is valid
		if (!image.mimetype.startsWith('image')) return res.sendStatus(400);

		//create pepper for image name without any symbols
		let pepper = Math.random().toString(36).substring(7);
		pepper = pepper.replace(/[^a-zA-Z0-9 ]/g, "");

		imageFile = image.name.split('.')[0] + pepper + '.' + image.mimetype.split('/')[1];
		await image.mv('./public/images/' + imageFile);
	}

	let plainPassword = req.body.name + '123!';
	let hashedPassword = await bcrypt.hash(plainPassword, 12);

	let user = await sendData({
		"documents": [
			{
				"username": req.body.name,
				"organism": {
					"$oid": req.body.organism
				},
				"image": imageFile,
				"password": hashedPassword,
			}
		]
	}, 'users', 'insertMany');
	res.redirect('/admin/users/' + user.data.insertedIds[0]);
});

router.get('/:id', async (req, res) => {
	//only get one user
	let user = await sendData({
		"pipeline": [
			{
				"$lookup": {
					"from": "organisms",
					"localField": "organism",
					"foreignField": "_id",
					"as": "organism"
				},
			},
			{
				"$set": {
					'organism': {
						"$first": '$organism'
					}
				}
			},
			{
				"$match": {
					"_id": {
						"$oid": req.params.id
					}
				}
			}
		]
	}, 'users', 'aggregate');


	let organisms = await sendData({}, 'organisms', 'find');
	res.render('admin/users/show.html.twig', {user: user.data.documents[0], organisms: organisms.data.documents});
});

router.post('/delete', async (req, res) => {
	//delete users
	await sendData({
		"filter": {
			"_id": {
				"$in": req.body.users?.map(id => {
					return {"$oid": id};
				})
			}
		}
	}, 'users', 'deleteMany');

	res.redirect('/admin/users');
});

router.post('/:id', async (req, res) => {
	let image = null;
	if (req.files) {
		image = req.files.image;
	}

	let imageFile = '';

	if (image) {
		//check if image is valid
		if (!image.mimetype.startsWith('image')) return res.sendStatus(400);

		//create pepper for image name without any symbols
		let pepper = Math.random().toString(36).substring(7);
		pepper = pepper.replace(/[^a-zA-Z0-9 ]/g, "");

		imageFile = image.name.split('.')[0] + pepper + '.' + image.mimetype.split('/')[1];
		await image.mv('./public/images/' + imageFile);
	}
	let data = {
		"filter": {
			"_id": {
				"$oid": req.params.id
			}
		},
		"update": {
			"$set": {
				"username": req.body.name,
				"organism": {
					"$oid": req.body.organism
				},
			}
		}
	};

	if (image) {
		data.update.$set.image = imageFile;
	}

	//update user
	await sendData(data, 'users', 'updateOne');

	res.redirect('/admin/users/' + req.params.id);
});

router.get('/:id/delete', async (req, res) => {
	//delete user
	await sendData({
		"filter": {
			"_id": {
				"$oid": req.params.id
			}
		}
	}, 'users', 'deleteOne');

	res.redirect('/admin/users');
});

module.exports = router;