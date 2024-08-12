const Path = require ('path')
const Application = require ('./lib/Application.js')
const TestCookieSession = require ('./lib/TestCookieSession.js')
const {getResponse} = require ('./lib/MockServer.js')
const {HttpStaticSite} = require ('..')
 
const newApp = () => {

	jest.resetModules ()

	return a = new Application ()

}

const newSvc = app => {

	const svc = app.createBackService ()

	new TestCookieSession ().plugInto (svc)

	return svc

}

async function getResponseFromWebService (svc, path, requestOptions, port) {

	return getResponse ({service: [

		svc,

		new HttpStaticSite ({root: Path.resolve ('__tests__/data')}),

	], path, requestOptions, listen: {port}})

}

test ('no session', async () => {

	const app = newApp (), svc = newSvc (app)

	const rp = await getResponseFromWebService (svc, '/?type=users', {method: 'POST', body: '{}'}, 8020)

	expect (rp.headers ['set-cookie'] [0]).toMatch ('sid=;')

})

test ('auth', async () => {

	const app = newApp (), svc = newSvc (app)

	const rp = await getResponseFromWebService (svc, '/?type=sessions&action=create', {method: 'POST', body: '{}'}, 8021)

	const sid = rp.headers ['set-cookie'] [0].slice (4, 40)

	expect (sid).toMatch (/\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/)

	const user = app.sessions [sid]

	expect (user.id).toBe (1)

	const rp1 = await getResponseFromWebService (svc, '/?type=users&part=current', {method: 'POST', body: '{}', headers: {Cookie: `sid=${sid}`}}, 8022)

	expect (rp1.responseJson.content).toStrictEqual (user)

	const rp2 = await getResponseFromWebService (svc, '/?type=sessions&action=delete', {method: 'POST', body: '{}', headers: {Cookie: `sid=${sid}`}}, 8023)

	expect (rp2.headers ['set-cookie'] [0]).toMatch ('sid=;')

	expect (app.sessions [sid]).toBeUndefined ()

})