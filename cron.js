const express = require('express');
const app = express();
const dotenv = require('dotenv');
const { sendEmail } = require('./src/helpers');
const { findStudentsWithoutNumeroCiByOrganism } = require('./src/functions');

dotenv.config();

const port = process.env.CRON_PORT || 3000;

const cron = require('node-cron');

// cron every minute
cron.schedule('* * * * *', async () => {
    console.log('Running cron job');
    let studentsWithoutNumeroCi = await findStudentsWithoutNumeroCiByOrganism();
    let studentsWithoutCiImage = await findStudentsWithoutCiImage(process.env.CURRENT_ORGANISM);

    //send email to admin
    if (studentsWithoutNumeroCi.length > 0 || studentsWithoutCiImage.length > 0) {
        let message = '';
        if (studentsWithoutNumeroCi.length > 0) {
            message += `Les étudiants suivants n'ont pas de numéro de CI: <br>`;
            studentsWithoutNumeroCi.forEach(student => {
                message += `${student.nom} ${student.prenom} <br>`;
            });
        }
        if (studentsWithoutCiImage.length > 0) {
            message += `Les étudiants suivants n'ont pas de photo de CI: <br>`;
            studentsWithoutCiImage.forEach(student => {
                message += `${student.nom} ${student.prenom} <br>`;
            });
        }
        await sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: 'Etudiants sans numéro de CI ou sans photo de CI',
            html: message
        });
    }
});




