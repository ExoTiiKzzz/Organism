const express = require('express');
const router = express.Router();
const csv = require('csv-parser')
const fs = require('fs')
const { sendData } = require('../../src/helpers.js');

const studentsRouter = require('./students');
router.use('/students', studentsRouter);

router.get('/', async (req, res) => {

    //find students if they dont have a 'NUMERO CI' field or if it is empty
    let students = await sendData({
        pipeline: [
            {
                $match: {
                    $or: [
                        {
                            'NUMERO CI': {
                                $exists: false
                            }
                        },
                        {
                            'NUMERO CI': ''
                        },
                    ],
                    $and: [
                        {
                            //check if the student is in current organism
                            'organism': {
                                $eq: {
                                    "$oid": req.session.user.organism
                                }
                            }
                        }
                    ]
                },
            },
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
    }, 'students', 'aggregate', {});


    res.render('front/index.html.twig', {
        students: students.data.documents,
    })
});

router.get('/provide', (req, res) => {
    res.render('front/provide.html.twig');
});

router.post('/provide', (req, res) => {
    const csvRows = [];
    //Save the file
    req.files.csv.mv('public/uploads/' + req.files.csv.name, function (err) {
        if (err) {
            res.redirect('/provide');
        } else {
            const csvRows = [];
            fs.createReadStream('public/uploads/promo.csv')
                .pipe(csv({
                    separator: ','
                }))
                .on('data', (row) => {
                    //add organism id
                    row.organism = {
                        "$oid": req.session.user.organism
                    }
                    csvRows.push(row);
                })
                .on('end', async () => {
                    //delete the file
                    fs.unlinkSync('public/uploads/' + req.files.csv.name);

                    //send the data to the database
                    let result = await sendData({
                        "documents": csvRows
                    }, 'students', 'insertMany');
                    res.redirect('/provide');
                });
        }
    });

});

module.exports = router;