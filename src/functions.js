const {sendData} = require("./helpers");

const findStudentsWithoutNumeroCi = async (organism) => {
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
									"$oid": organism
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

	return students;
}

const findStudentsWithoutCiImage = async (organism) => {
	//find students if they dont have a 'NUMERO CI' field or if it is empty
	let students = await sendData({
		pipeline: [
			{
				$match: {
					$or: [
						{
							'ci_image': {
								$exists: false
							}
						},
						{
							'ci_image': ''
						},
					],
					$and: [
						{
							//check if the student is in current organism
							'organism': {
								$eq: {
									"$oid": organism
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

	return students;
}

const findStudentsWithoutNumeroCiByOrganism = async () => {
	let organisms = await sendData({}, 'organisms', 'find', {});
	let students = [];
	for (let i = 0; i < organisms.data.documents.length; i++) {
		let organism = organisms.data.documents[i];
		let studentsWithoutNumeroCi = await findStudentsWithoutNumeroCi(organism._id);
		if (studentsWithoutNumeroCi.data.documents.length > 0) {
			students[organism.email] = studentsWithoutNumeroCi.data.documents;
		}
	}

	return students;
}

const findStudentsWithoutCiImageByOrganism = async () => {
	let organisms = await sendData({}, 'organisms', 'find', {});
	let students = [];
	for (let i = 0; i < organisms.data.documents.length; i++) {
		let organism = organisms.data.documents[i];
		let studentsWithoutCiImage = await findStudentsWithoutCiImage(organism._id);
		if (studentsWithoutCiImage.data.documents.length > 0) {
			students[organism.email] = studentsWithoutCiImage.data.documents;
		}
	}

	return students;
}

const findStudentsWithMissingInfos = async () => {
	let organisms = await sendData({}, 'organisms', 'find', {});
	let missingInfos = [];
	for (let i = 0; i < organisms.data.documents.length; i++) {
		let organism = organisms.data.documents[i];
		let studentsWithoutNumeroCi = await findStudentsWithoutNumeroCi(organism._id);
		let studentsWithoutCiImage = await findStudentsWithoutCiImage(organism._id);
		if (studentsWithoutNumeroCi.data.documents.length > 0 || studentsWithoutCiImage.data.documents.length > 0) {
			missingInfos.push(
				{
					organism: organism.email,
					studentsWithoutNumeroCi: studentsWithoutNumeroCi.data.documents,
					studentsWithoutCiImage: studentsWithoutCiImage.data.documents
				}
			)
		}
	}

	return missingInfos;
}

const findStudents = async (params = {}) => {
	let filters = {};
	let possibleFilters = [
		{
			key: 'organism',
			field: 'organism._id',
		},
		{
			key: 'promotion',
			field: 'promotion._id',
		},
		{
			key: 'degree',
			field: 'degree._id',
		}
	]

	let $and = [];

	if (params.hasOwnProperty('query') && Object.keys(params.query).length > 0) {
		let query = params.query;
		//loop through possible filters

		possibleFilters.forEach(filter => {
			let key = filter.key;
			let field = filter.field;
			if (query.hasOwnProperty(key) && query[key] !== '' && query[key] !== null && query[key] !== undefined) {
				let obj = {};
				if (Array.isArray(query[key])) {
					obj = {
						[field]: {
							$in: []
						}
					};
					query[key].forEach(param => {
						if (param !== '' && param !== null && param !== undefined) {
							obj[field].$in.push({
								"$oid": param
							});
						}
					});

					if (obj[field].$in.length === 0) {
						delete obj[field];
					}
				} else {
					obj = {
						[field]: {
							$eq: {
								"$oid": query[key]
							}
						}
					};
				}

				//check if obj is not empty
				if (Object.keys(obj).length > 0) {
					$and.push(obj);
				}
			}
		});

		//check if query has start date
		if (query.hasOwnProperty('start') && query.start !== '' && query.start !== null && query.start !== undefined) {
			let obj = {};
			obj['promotion.start'] = {
				$gte: new Date(query.start)
			};
			$and.push(obj);
		}

		//check if query has end date
		if (query.hasOwnProperty('end') && query.end !== '' && query.end !== null && query.end !== undefined) {
			let obj = {};
			obj['promotion.end'] = {
				$lte: new Date(query.end)
			};
			$and.push(obj);
		}

		console.log($and)
	}


	if ($and.length > 0) {
		console.log($and);
		filters.$and = $and;
	}

	if (params.hasOwnProperty('search')) {

	}


	return await sendData({
		pipeline: [
			{
				$lookup: {
					from: "organisms",
					localField: "organism",
					foreignField: "_id",
					as: "organism"
				},
			},
			{
				$lookup: {
					from: "promotions",
					localField: "promotion",
					foreignField: "_id",
					as: "promotion"
				}
			},
			{
				$lookup: {
					from: "degrees",
					localField: "promotion.degree",
					foreignField: "_id",
					as: "degree",
				}
			},
			{
				$unwind: {
					path: '$organism',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$unwind: {
					path: '$promotion',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$unwind: {
					path: '$degree',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: filters
			},
		]
	}, 'students', 'aggregate', {});

}

module.exports = {
	findStudentsWithoutNumeroCi,
	findStudentsWithoutCiImage,
	findStudentsWithoutNumeroCiByOrganism,
	findStudentsWithoutCiImageByOrganism,
	findStudentsWithMissingInfos,
	findStudents
}