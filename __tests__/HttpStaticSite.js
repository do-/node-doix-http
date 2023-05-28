const http = require ('http')
const Path = require ('path')
const {HttpRouter, HttpStaticSite} = require ('..')

const newStaticSite = () => {
	
	const s = new HttpStaticSite ({root: Path.resolve ('__tests__/data')})
		
	return s
	
}

async function getResponse (o) {

	if (!o.listen) o.listen = {}
	if (!o.listen.host) o.listen.host = '127.0.0.1'
	if (!o.listen.port) o.listen.port = 8000

	if (!o.requestOptions) o.requestOptions = {}
	
	const {listen, service, path, requestOptions} = o
	
	try {

		var r = new HttpRouter ({listen})
		
		r.on ('error', (o, e) => console.log ({o, e}))
		
		r.add (service)
		
		r.listen ()
		
		const rp = await new Promise ((ok, fail) => {
		
			service.on ('error', () => 0)

			const rq = http.request (`http://${listen.host}:${listen.port}${path}`, requestOptions, ok)

			rq.end ()

		})
		
		const a = []; for await (b of rp) a.push (b)
		
		rp.responseText = Buffer.concat (a).toString ()
				
		return rp

	}
	finally {

		await r.close ()

	}
	
}

async function getResponseFromStaticSite (path) {

	return getResponse ({service: newStaticSite (), path})

}

test ('dir', async () => {

	const rp = await getResponseFromStaticSite ('/')
	
	expect (rp.statusCode).toBe (200)
	expect (rp.responseText).toBe ('It worked')

})

test ('200', async () => {

	const rp = await getResponseFromStaticSite ('/index.html')
	
	expect (rp.statusCode).toBe (200)
	expect (rp.headers ['content-type']).toBe ('text/html')
	expect (rp.responseText).toBe ('It worked')

})

test ('no-type', async () => {

	const rp = await getResponseFromStaticSite ('/README')
	expect (rp.headers ['content-type']).toBe ('application/octet-stream')
	expect (rp.statusCode).toBe (200)

})

test ('unknown-type', async () => {

	const rp = await getResponseFromStaticSite ('/README.not')
	expect (rp.headers ['content-type']).toBe ('application/octet-stream')
	expect (rp.statusCode).toBe (200)

})

test ('404', async () => {

	const rp = await getResponseFromStaticSite ('/index.htm')

	expect (rp.statusCode).toBe (404)

})