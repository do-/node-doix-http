const Path = require ('path')
const Application = require ('./lib/Application.js')
const {getResponse} = require ('./lib/MockServer.js')
const {WebService} = require ('..')

const app = () => {

	jest.resetModules ()

	return new Application ()

}

async function getResponseFromWebService (path, requestOptions, serviceOptions) {

	const service = app ().createBackService (serviceOptions)

	return getResponse ({service, path, requestOptions})

}

test ('constructor', () => {

//	expect (new WebService (app ())).toBeInstanceOf (WebService)

	expect (() => app ().createBackService ({location: 1})).toThrow ()

	expect (() => app ().createBackService ({location: ''})).toThrow ()

	expect (() => app ().createBackService ({location: '_back'})).toThrow ()

	expect (() => app ().createBackService ({location: '/_back', test: s => true})).toThrow ()

})

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

test ('location', async () => {

	const rp = await getResponseFromWebService ('/back/?type=users', {method: 'POST', body: '{}'}, {location: '/back'})

	expect (rp.statusCode).toBe (200)

})

test ('location_re', async () => {

	const rp = await getResponseFromWebService ('/back/?type=users', {}, {location: /^\/back/})

	expect (rp.statusCode).toBe (405)

})
