const express = require('express');
const app = express();
const dotenv = require('dotenv');
const { sendEmail } = require('./src/helpers');
const { findStudentsWithMissingInfos } = require('./src/functions');

dotenv.config();

const port = process.env.CRON_PORT || 3000;

const cron = require('node-cron');

// cron every minute
cron.schedule('* * * * *', async () => {
    console.log('⌛ Cron started');
    let missingInfosStudents = await findStudentsWithMissingInfos();

    if (missingInfosStudents.length > 0) {
        for (const missingInfosStudent of missingInfosStudents) {
            let email = missingInfosStudent.organism;
            let message = '<p>Hi,</p>';
            message += '<p>Here is the list of students with missing informations:</p>';

            if (missingInfosStudent.studentsWithoutNumeroCi.length > 0) {
                message += '<p>Students without numero ci: <br></p>';
                for (const student of missingInfosStudent.studentsWithoutNumeroCi) {
                    message += '<p>' + student.PRENOM + ' ' + student.NOM + '</p>';
                }
                message += '<br>';
            }

            if (missingInfosStudent.studentsWithoutCiImage.length > 0) {
                message += '<p>Students without ci image: <br></p>';
                for (const student of missingInfosStudent.studentsWithoutCiImage) {
                    message += '<p>' + student.PRENOM + ' ' + student.NOM + '</p>';
                }
                message += '<br>';
            }

            console.log('📧 Sending mail to ' + email);
            await sendEmail({
                subject: "Missing informations",
                html: message,
                to: email,
                from: process.env.MAIL_ADDRESS
            });
            console.log('✉️  Mail sent to ' + email);
        }
    }
    console.log('✅ Cron finished');
});

app.listen(port, () => {
    console.log(`Cron listening at http://localhost:${port}`)
});




