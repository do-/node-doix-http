const Path = require ('path')
const Application = require ('./lib/Application.js')
const {getResponse} = require ('./lib/MockServer.js')
const {HttpStaticSite} = require ('http-server-tools')
const {Router} = require ('protocol-agnostic-router')
const {WebService} = require ('..')

const app = () => {

	jest.resetModules ()

	return new Application ()

}

async function getResponseFromWebService (path, requestOptions, serviceOptions) {

	const staticSite = new HttpStaticSite ({root: Path.resolve ('__tests__/data')})

	staticSite [Router.PROCESS_MESSAGE] = response => {
		staticSite.handle (response).then (_ => _, _ => _)
	}

	return getResponse ({service: [

		app ().createBackService (serviceOptions),

		staticSite,

	], path, requestOptions})

}

test ('constructor', () => {

	expect (() => new WebService (app (), {name: 'ws'})).toThrow ('methods')

	expect (() => new WebService (app (), {name: 'ws', methods: 'POST'})).toThrow ('methods')

	expect (() => new WebService (app (), {name: 'ws', methods: []})).toThrow ('methods')

	expect (() => app ().createBackService ({location: 1})).toThrow ()

	expect (() => app ().createBackService ({location: ''})).toThrow ()

	expect (() => app ().createBackService ({location: '_back'})).toThrow ()

	expect (() => app ().createBackService ({location: '/_back', test: s => true})).toThrow ()

	expect (app ().createBackService ({}).ctxOptions.pathBase).toBe (0)
	expect (app ().createBackService ({location: '/_back'}).ctxOptions.pathBase).toBe (1)
	expect (app ().createBackService ({location: '/_back/'}).ctxOptions.pathBase).toBe (1)

})

test ('no method', async () => {

	const rp = await getResponseFromWebService ('/?type=userz', {method: 'POST', body: '{}'})

	expect (rp.responseJson.success).toBe (false)

})

test ('200', async () => {

	const rp = await getResponseFromWebService ('/?type=users', {method: 'POST', body: '{}'})

	expect (rp.statusCode).toBe (200)
	expect (rp.headers ['content-type']).toBe ('application/json; charset=utf-8')
	expect (rp.responseJson).toStrictEqual ({success: true, content: []})

})


test ('bad type', async () => {

	const rp = await getResponseFromWebService ('/?type=users', {method: 'POST', body: '{"part": "one"}'})
	expect (rp.statusCode).toBe (500)
	expect (rp.responseText).toBe ('')

})
	

test ('bad type, ignored', async () => {

	const rp = await getResponseFromWebService ('/?type=users', {method: 'POST', body: '{"part": "one"}'}, {getRequest: ctx => ctx.searchParams})
	expect (rp.statusCode).toBe (200)
	expect (rp.responseJson).toStrictEqual ({success: true, content: []})

})

test ('empty response', async () => {

	const rp = await getResponseFromWebService ('/?type=users', {method: 'POST', body: '{"action": "nothing"}'})
	expect (rp.statusCode).toBe (200)
	expect (rp.responseJson).toStrictEqual ({success: true, content: null})

})

test ('stream', async () => {

	const rp = await getResponseFromWebService ('/?type=users&part=stream', {method: 'POST', body: '{}'})

	expect (rp.statusCode).toBe (200)
	expect (rp.headers ['content-type']).toBe ('application/json')
	expect (rp.responseJson).toStrictEqual ([])

})

test ('450', async () => {

	const rp = await getResponseFromWebService ('/?type=users', {})

	expect (rp.statusCode).toBe (405)

})

test ('location', async () => {

	const rp = await getResponseFromWebService ('/back/?type=users', {method: 'POST', body: '{}'}, {location: '/back/?type=users'})

	expect (rp.statusCode).toBe (200)

})

test ('location', async () => {

	const rp = await getResponseFromWebService ('/back/?type=users', {method: 'POST', body: '{}'}, {location: '/back'})

	expect (rp.statusCode).toBe (200)

})

test ('location_re', async () => {

	const rp = await getResponseFromWebService ('/back/?type=users', {}, {location: /^\/back/})

	expect (rp.statusCode).toBe (405)

})

test ('location_miss', async () => {

	const rp = await getResponseFromWebService ('/black/?type=users', {method: 'POST', body: '{}'}, {location: '/back'})

	expect (rp.statusCode).toBe (404)

})

test ('location_/', async () => {

	const rp = await getResponseFromWebService ('/back/?type=users', {method: 'POST', body: '{}'}, {location: '/back/'})

	expect (rp.statusCode).toBe (404)

})