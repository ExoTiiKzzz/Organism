const axios = require('axios');

const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const apiBase = {
	"database": "organism",
	"dataSource": "Cours",
};

let configBase = {
	method: 'post',
	url: 'https://eu-west-2.aws.data.mongodb-api.com/app/data-fmlle/endpoint/data/v1/action/',
	headers: {
		'Content-Type': 'application/json',
		'Access-Control-Request-Headers': '*',
		'api-key': 'NzlyJClofBldZmVp8GpXEn9pMhNvPouDHg9zSiqWeMj0RcwiEt70z6cubkzIpX2R',
	},
};

const sendData = async (data = {}, collection = 'students', action = 'find', projection = {"_id": 1}) => {
	try {
		//clone apiBase object
		let api = JSON.parse(JSON.stringify(apiBase));
		api.collection = collection;
		//loop through data keys and add them to api object
		for (const [key, value] of Object.entries(data)) {
			api[key] = value;
		}

		let config = JSON.parse(JSON.stringify(configBase));
		config.url += action;
		config.data = api;

		return axios(config);
	} catch (error) {
		console.log(error.response.data);
	}
}

const createTransporter = async () => {
	const oauth2Client = new OAuth2(
		process.env.MAIL_CLIENT_ID,
		process.env.MAIL_CLIENT_SECRET,
		"https://developers.google.com/oauthplayground"
	);

	oauth2Client.setCredentials({
		refresh_token: process.env.MAIL_REFRESH_TOKEN
	});

	const accessToken = await new Promise((resolve, reject) => {
		oauth2Client.getAccessToken((err, token) => {
			if (err) {
				console.log(err);
				reject("Failed to create access token :(");
			}
			resolve(token);
		});
	});

	return nodemailer.createTransport({
		service: "gmail",
		auth: {
			type: "OAuth2",
			user: process.env.MAIL_ADDRESS,
			accessToken,
			clientId: process.env.MAIL_CLIENT_ID,
			clientSecret: process.env.MAIL_CLIENT_SECRET,
			refreshToken: process.env.MAIL_REFRESH_TOKEN
		}
	});
};

const sendEmail = async (emailOptions) => {
	let emailTransporter = await createTransporter();
	await emailTransporter.sendMail(emailOptions);
};


module.exports = {
	sendData,
	sendEmail
}