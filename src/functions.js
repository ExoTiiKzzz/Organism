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

const findStudents = async (params = {}) => {
	let filters = {};
	if (params.hasOwnProperty('organism')) {
		if (Array.isArray(params.organism)) {
			filters.organism = {
				$in: params.organism.map((organism) => {
					return {
						"$oid": organism
					}
				})
			}
		} else {
			filters.organism = {
				$eq: {
					"$oid": params.organism
				}
			}
		}
	}

	if (params.hasOwnProperty('promotion')) {
		//check if there is multiple promotions
		if (Array.isArray(params.promotion)) {
			filters.promotion = {
				$in: params.promotion.map((promotion) => {
					return {
						"$oid": promotion
					}
				})
			}
		} else {
			filters.promotion = {
				$eq: {
					"$oid": params.promotion
				}
			}
		}
	}

	if (params.hasOwnProperty('degree')) {
		//check if there is multiple degrees
		if (Array.isArray(params.degree)) {
			filters.degree = {
				$in: params.degree.map((degree) => {
					return {
						"$oid": degree
					}
				})
			}
		} else {
			filters.degree = {
				$eq: {
					"$oid": params.degree
				}
			}
		}
	}

	if (params.hasOwnProperty('search')) {

	}


	return await sendData({
		pipeline: [
			{
				$match: filters
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
				$unwind: {
					path: '$organism',
					preserveNullAndEmptyArrays: true
				}
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
				$unwind: {
					path: '$promotion',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: "degrees",
					localField: "promotion.degree",
					foreignField: "_id",
					as: "degree"
				}
			},
			{
				$unwind: {
					path: '$degree',
					preserveNullAndEmptyArrays: true
				}
			}
		]
	}, 'students', 'aggregate', {});

}

module.exports = {
	findStudentsWithoutNumeroCi,
	findStudentsWithoutCiImage
}