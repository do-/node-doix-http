const Path = require ('path')
const Application = require ('./lib/Application.js')
const {getResponse} = require ('./lib/MockServer.js')

async function getResponseFromWebService (path, requestOptions) {

	const service = (new Application ()).createBackService ()

	return getResponse ({service, path, requestOptions})

}

test ('200', async () => {

	const rp = await getResponseFromWebService ('/?type=users', {method: 'POST', body: '{}'})

	expect (rp.statusCode).toBe (200)
	expect (rp.headers ['content-type']).toBe ('application/json; charset=utf-8')
	expect (rp.responseJson).toStrictEqual ({success: true, content: []})

})

test ('450', async () => {

	const rp = await getResponseFromWebService ('/?type=users', {})

	expect (rp.statusCode).toBe (405)

})