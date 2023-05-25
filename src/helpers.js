const axios = require('axios');

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

module.exports = {sendData};