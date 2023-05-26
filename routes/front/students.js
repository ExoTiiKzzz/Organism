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

module.exports = router;