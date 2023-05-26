const express = require('express');
const router = express.Router();
const { sendData } = require('../../src/helpers.js');

router.get('/', async (req, res) => {

});

router.get('/new', async (req, res) => {
    res.render('front/promo/show.html.twig');
});

module.exports = router;