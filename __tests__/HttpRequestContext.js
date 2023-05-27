const  http      = require ('http')
const {Readable} = require ('stream')
const {HttpRequestContext} = require ('..')

test ('searchParams', () => {

	const c = new HttpRequestContext ({url: '/?type=users&id=1'}, {})

	expect ([...c.searchParams]).toStrictEqual ([['type', 'users'], ['id', '1']])

})

test ('getBodyAsString', async () => {

	const c = new HttpRequestContext (Readable.from (Buffer.from ('{}')), {})

	const s = await c.getBodyAsString ()

	expect (s).toBe ('{}')

})

test ('writeStringDefault', async () => {

	const r = new http.ServerResponse ({}), c = new HttpRequestContext ({}, r)
	
	c.writeString ('1')

	expect (r.statusCode).toBe (200)
	expect (r.getHeader ('content-length')).toBe (1)

})

test ('writeString500', async () => {

	const r = new http.ServerResponse ({}), c = new HttpRequestContext ({}, r)
	
	c.writeString ('1', {code: 500})

	expect (r.statusCode).toBe (500)
	expect (r.getHeader ('content-length')).toBe (1)
	expect (r.getHeader ('content-type')).toBe ('text/plain; charset=utf-8')

})

test ('writeStringEncoding', async () => {

	const r = new http.ServerResponse ({}), c = new HttpRequestContext ({}, r)
	
	c.writeString ('1', {encoding: 'utf16le'})

	expect (r.getHeader ('content-length')).toBe (2)

})

test ('writeStringType', async () => {

	const r = new http.ServerResponse ({}), c = new HttpRequestContext ({}, r)
	
	c.writeString ('<a></a>', {type: 'application/xml'})

	expect (r.getHeader ('content-type')).toBe ('application/xml; charset=utf-8')

})

test ('writeBuffer', async () => {

	const r = new http.ServerResponse ({}), c = new HttpRequestContext ({}, r)
	
	c.writeBuffer (Buffer.from ('1'))

	expect (r.getHeader ('content-length')).toBe (1)

})

test ('writeStream', async () => {

	const r = new http.ServerResponse ({}), c = new HttpRequestContext ({}, r)
	
	c.writeStream (Readable.from (Buffer.from ('1')))

	expect (r.getHeader ('content-type')).toBe ('application/octet-stream')

})

test ('writeStreamType', async () => {

	const r = new http.ServerResponse ({}), c = new HttpRequestContext ({}, r)

	r.setHeader ('Content-Type', 'text/plain')

	c.writeStream (Readable.from (Buffer.from ('1')))

	expect (r.getHeader ('content-type')).toBe ('text/plain')
	
	c.writeStream ()

})