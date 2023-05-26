const express = require('express');
const router = express.Router();
const fs = require('fs');

const {sendData} = require('../../src/helpers.js');
const bcrypt = require("bcrypt");
const {findStudentsWithoutNumeroCi, findStudentsWithoutCiImage} = require("../../src/functions");
const decompress = require('decompress');

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
    let randomString = Math.random().toString(36).substring(7);
    let uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }
    //create directory if it doesn't exist
    let dir = `uploads/${randomString}`;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    //save file
    let zip = req.files.file;
    await zip.mv(`${dir}/${zip.name}`, async function (err) {

    });

    //unzip file
    await decompress(`${dir}/${zip.name}`, dir);

    //get all files in directory
    let files = fs.readdirSync(dir + '/zip');

    //loop through files
    let imageExtensions = ['jpg', 'jpeg', 'png'];
    for (let i = 0; i < files.length; i++) {
        //check if file is image
        if (imageExtensions.includes(files[i].split('.').pop())) {
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

            //if student exists
            if (student.data) {
                let studentId = student.data._id.$oid;
                //check if student has ci image
                if (student.data['ci_image']) {
                    //delete old image
                    fs.unlinkSync(`uploads/${student.data['ci_image']}`);
                }
                //save new image
                fs.renameSync(`${dir}/zip/${files[i]}`, `uploads/${files[i]}`);
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
                            'ci_image': files[i]
                        }
                    }
                }, 'students', 'updateOne');
            }
        }
    }

    //delete directory
    fs.rmdirSync(dir, {recursive: true});

    res.redirect('/');

});

module.exports = router;