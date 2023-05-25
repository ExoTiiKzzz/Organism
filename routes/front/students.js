const express = require('express');
const router = express.Router();

const {sendData} = require('../../src/helpers.js');
const bcrypt = require("bcrypt");

router.get('/missing', async (req, res) => {
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


    res.render('front/missing.html.twig', {
        students: students.data.documents,
    })
});

router.post('/missing', async (req, res) => {
    //students is an object with the student id as key and the ci as value
    let students = req.body.ci;
    let organism = req.session.user.organism;

    //get keys of students object
    let keys = Object.keys(students);

    //loop through keys
    for (let i = 0; i < keys.length; i++) {
        if (students[keys[i]] === '') {
            continue;
        }
        await sendData({
            filter: {
                _id: {
                    $eq: {
                        $oid: keys[i]
                    }
                }
            },
            update: {
                $set: {
                    'NUMERO CI': students[keys[i]]
                }
            }
        }, 'students', 'updateOne');
    }

    res.redirect('/');
});

module.exports = router;