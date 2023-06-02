const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { sendData } = require('../../src/helpers.js');

router.get('/', (req, res) => {
	if (req.session?.user) {
		res.redirect('/');
		return;
	}
	res.render('login.html.twig', {
		lastUsername: req.query.lastUsername
	});
});

router.post('/', async (req, res) => {
	let username = req.body.username;
	let password = req.body.password;

	let user = await sendData({
		"filter": {
			"username": username
		}
	}, 'users', 'findOne');

	if (user.data.document) {
		bcrypt.compare(password, user.data.document.password, async (err, result) => {
			if (result) {
				console.log(user.data.document);
				let organism = await sendData({
					"filter": {
						"_id": {
							"$oid": user.data.document.organism
						}
					}
				}, 'organisms', 'findOne');
				req.session.user = user.data.document;
				req.session.organism = organism.data.document;

				res.redirect('/');
			} else {
				res.redirect('/login?lastUsername=' + username);
			}
		});
	} else {
		res.redirect('/login?lastUsername=' + username);
	}

});

module.exports = router;