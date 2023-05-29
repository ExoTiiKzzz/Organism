const express = require('express');
const router = express.Router();
const csv = require('csv-parser')
const fs = require('fs')
const { sendData } = require('../../src/helpers.js');
const { findStudentsWithoutNumeroCi, findStudentsWithoutCiImage } = require('../../src/functions.js');

const studentsRouter = require('./students');
router.use('/students', studentsRouter);

const degreesRouter = require('./degrees');
router.use('/degrees', degreesRouter);

const promotionsRouter = require('./promotions');
router.use('/promotions', promotionsRouter);

router.get('/', async (req, res) => {
    let studentsWithoutCiNumber = await findStudentsWithoutNumeroCi(req.session.user.organism);
    let studentsWithoutCiImage = [];
    if (studentsWithoutCiNumber.data.documents.length === 0) {
        studentsWithoutCiImage = await findStudentsWithoutCiImage(req.session.user.organism);
    }

    res.render('front/index.html.twig', {
        studentsWithoutCiNumber: studentsWithoutCiNumber.data.documents,
        studentsWithoutCiImage: studentsWithoutCiImage?.data?.documents,
    })
});



module.exports = router;