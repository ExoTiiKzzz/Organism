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

module.exports = {
	findStudentsWithoutNumeroCi,
	findStudentsWithoutCiImage
}