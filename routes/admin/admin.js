const express = require('express');
const router = express.Router();

const userRouter = require('./users');
const organismRouter = require('./organisms');

router.use((req, res, next) => {
	if (!req.session.user.role || req.session.user.role !== 'admin') {
		res.redirect('/');
	} else {
		next();
	}
});

router.use('/users', userRouter);

router.use('/organisms', organismRouter);

router.get('/', async (req, res) => {
	res.redirect('/admin/users');
});

module.exports = router;