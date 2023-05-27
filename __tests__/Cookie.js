const http = require ('http')
const {Cookie} = require ('..')

test ('constructor', () => {

	const c = new Cookie ()
	
	expect (c.name).toBe ('sid')
	expect (c.ttl).toBe (30)

})

test ('getRawDefault', () => {

	const c = new Cookie ()
	
	expect (c.getRaw ({headers: {}})).toBeNull
	expect (c.getRaw ({headers: {cookie: 'JSESSIONID=58ca212bda5c9b27f7319ee0b9806091; path=/; expires=Mon, 26-Jun-2023 13:52:35 GMT'}})).toBeNull ()
	expect (c.getRaw ({headers: {cookie: 'sid=58ca212bda5c9b27f7319ee0b9806091; path=/; expires=Mon, 26-Jun-2023 13:52:35 GMT'}})).toBe ('58ca212bda5c9b27f7319ee0b9806091')

})

test ('getRaw', () => {

	const c = new Cookie ({name: 'JSESSIONID'})
	
	expect (c.getRaw ({headers: {}})).toBeNull
	expect (c.getRaw ({headers: {cookie: 'JSESSIONID=58ca212bda5c9b27f7319ee0b9806091; path=/; expires=Mon, 26-Jun-2023 13:52:35 GMT'}})).toBe ('58ca212bda5c9b27f7319ee0b9806091')
	expect (c.getRaw ({headers: {cookie: 'sid=58ca212bda5c9b27f7319ee0b9806091; path=/; expires=Mon, 26-Jun-2023 13:52:35 GMT'}})).toBeNull ()

})

test ('setRaw', () => {

	const c = new Cookie (), r = new http.ServerResponse ({})
	
	c.setRaw (r, '1')
	
	expect (r.getHeader ('Set-Cookie')).toBe ('sid=1; HttpOnly')

})
