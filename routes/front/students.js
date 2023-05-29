const express = require('express');
const router = express.Router();
const fs = require('fs');

const {sendData} = require('../../src/helpers.js');
const bcrypt = require("bcrypt");
const {findStudentsWithoutNumeroCi, findStudentsWithoutCiImage} = require("../../src/functions");
const decompress = require('decompress');
const csv = require("csv-parser");

router.get('/', async (req, res) => {
    let students = await sendData({
        //get all students and if student doesn't have a promotion, promotion will be an empty array
        pipeline: [
            {
                $lookup: {
                    from: 'promotions',
                    localField: 'promotion',
                    foreignField: '_id',
                    as: 'promotion'
                },
            },
            {
                $unwind: {
                    path: '$promotion',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'degrees',
                    localField: 'promotion.degree',
                    foreignField: '_id',
                    as: 'degree'
                },
            },
            {
                $unwind: {
                    path: '$degree',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    organism: {
                        $eq: {
                            $oid: req.session.user.organism
                        }
                    }
                }
            }
        ],
    }, 'students', 'aggregate');

    res.render('front/students/index.html.twig', {
        students: students.data.documents
    });
});

router.get('/new', async (req, res) => {
    let promotions = await sendData({
        filter: {
            organism: {
                $eq: {
                    $oid: req.session.user.organism
                }
            }
        }
    }, 'promotions', 'find');

    res.render('front/students/show.html.twig', {
        promotions: promotions.data.documents
    });
});



router.get('/missing/number', async (req, res) => {
//find students if they dont have a 'NUMERO CI' field or if it is empty
    let students = await findStudentsWithoutNumeroCi(req.session.user.organism);


    res.render('front/missing_number.html.twig', {
        students: students.data.documents,
    })
});

router.post('/missing/number', async (req, res) => {
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

router.get('/missing/photo', async (req, res) => {
//find students if they dont have a 'NUMERO CI' field or if it is empty
    let students = await findStudentsWithoutCiImage(req.session.user.organism);


    res.render('front/missing_photo.html.twig', {
        students: students.data.documents,
    })
});

router.post('/missing/photo', async (req, res) => {
    //save zip file in uploads folder
    let randomString = Math.random().toString(36).substring(7) + Math.random().toString(36).substring(7) + Math.random().toString(36).substring(7);
    let uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
        console.log('qbjsqjbdqsjbdjnj')
        fs.mkdirSync(uploadDir);
    }
    //create directory if it doesn't exist
    let dir = `${uploadDir}/${randomString}`;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    //save file
    let zip = req.files.file;
    console.log('pdpdsppsdf')
    await zip.mv(`${dir}/${zip.name}`, async function (err) {

    });

    //unzip file
    console.log('pisdoqjdojsqd')
    await decompress(`${dir}/${zip.name}`, dir);

    dir = `${dir}/${zip.name.split('.')[0]}`;

    //get all files in directory
    console.log('qsdqsdqsd')
    let files = fs.readdirSync(dir);

    //loop through files
    let imageExtensions = ['jpg', 'jpeg', 'png'];
    for (let i = 0; i < files.length; i++) {
        let extension = files[i].split('.').pop();
        //check if file is image
        if (imageExtensions.includes(extension)) {
            //get student ci number
            let studentCiNumber = files[i].split('.')[0];
            //get student
            let student = await sendData({
                filter: {
                    'NUMERO CI': {
                        $eq: studentCiNumber
                    }
                }
            }, 'students', 'findOne');

            student = student.data?.document;

            //if student exists
            if (student) {
                let studentId = student._id;
                //random file name with 30 characters
                let randomStringForImage = Math.random().toString(36).substring(7) + Math.random().toString(36).substring(7) + Math.random().toString(36).substring(7);
                //check if student has ci image
                if (student.ci_image) {
                    //check if file exists
                    if (fs.existsSync(`uploads/${student.ci_image}`)) {
                        //delete old image
                        console.log('renamingssssssssss')
                        fs.unlinkSync(`uploads/${student.ci_image}`);
                    }
                }
                //save new image
                console.log('renaming')
                fs.renameSync(`${dir}/${files[i]}`, `uploads/${randomStringForImage}.${extension}`);
                //update student
                await sendData({
                    filter: {
                        _id: {
                            $eq: {
                                $oid: studentId
                            }
                        }
                    },
                    update: {
                        $set: {
                            'ci_image': `${randomStringForImage}.${extension}`

                        }
                    }
                }, 'students', 'updateOne');
            }
        }
    }

    //delete directory
    fs.rmdirSync('uploads/' + randomString, {recursive: true});


    res.redirect('/');

});

router.get('/provide', async (req, res) => {
    //get all promotions with degree associated to the promotion
    let promotions = await sendData({
        pipeline: [
            {
                $lookup: {
                    from: 'degrees',
                    localField: 'degree',
                    foreignField: '_id',
                    as: 'degree'
                }
            },
            {
                $unwind: '$degree'
            },
            {
                $match: {
                    organism: {
                        $eq: {
                            $oid: req.session.user.organism
                        }
                    }
                }
            }
        ]
    }, 'promotions', 'aggregate');

    res.render('front/provide.html.twig', {
        promotions: promotions.data.documents
    });
});

router.post('/provide', (req, res) => {
    const csvRows = [];
    //Save the file
    if (!fs.existsSync('uploads/tmp' + req.files.csv.name)) {
        //create directory if it doesn't exist
        let dir = `uploads`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        if (!fs.existsSync('uploads/tmp')) {
            fs.mkdirSync('uploads/tmp');
        }
    }
    req.files.csv.mv('uploads/tmp/' + req.files.csv.name, function (err) {
        if (err) {
            console.log('Error saving file: ' + err);
            res.redirect('/students/provide');
        } else {
            const csvRows = [];
            fs.createReadStream('uploads/tmp/promo.csv')
                .pipe(csv({
                    separator: ','
                }))
                .on('data', (row) => {
                    //add organism id
                    row.organism = {
                        "$oid": req.session.user.organism
                    }
                    //add promotion id
                    row.promotion = {
                        "$oid": req.body.promotion
                    }
                    csvRows.push(row);
                })
                .on('end', async () => {
                    //delete the file
                    fs.unlinkSync('uploads/tmp/' + req.files.csv.name);

                    //send the data to the database
                    let result = await sendData({
                        "documents": csvRows
                    }, 'students', 'insertMany');
                    res.redirect('/students/provide');
                });
        }
    });

});

router.get('/:id', async (req, res) => {
    let student = await sendData({
        filter: {
            _id: {
                $eq: {
                    $oid: req.params.id
                }
            }
        }
    }, 'students', 'findOne');

    let promotions = await sendData({
        filter: {
            organism: {
                $eq: {
                    $oid: req.session.user.organism
                }
            }
        }
    }, 'promotions', 'find');

    let keys = Object.keys(student.data.document);

    res.render('front/students/show.html.twig', {
        student: student.data.document,
        promotions: promotions.data.documents,
        keys: keys
    });
});

router.post('/:id', async (req, res) => {
    let keys = Object.keys(req.body);

    let data = req.body;
    let update = {
        $set: {}
    };

    for (let i = 0; i < keys.length; i++) {
        if (data[keys[i]] !== '' && data[keys[i]] !== undefined) {
            if (keys[i].includes('_id')) {
                let name = keys[i].split('_id')[0];
                update.$set[name] = {
                    $oid: data[keys[i]]
                }
            } else {
                update.$set[keys[i]] = data[keys[i]];
            }
        }
    }

    console.log(update);

    await sendData({
        filter: {
            _id: {
                $eq: {
                    $oid: req.params.id
                }
            }
        },
        update: update
    }, 'students', 'updateOne');

    res.redirect('/students');
});

module.exports = router;