const {HttpRouter} = require ('..')

test ('constructor', async () => {

	new HttpRouter ({listen: {port: 8001}, logger: null})

})

test ('listen', async () => {

	const r = new HttpRouter ({listen: {port: 8002}})
		
	let f = false
	
	r.on ('start', () => f = true)
	r.on ('finish', () => f = false)

	expect (f).toBe (false)
		
	r.listen ()

	expect (f).toBe (true)

	await r.close ()

	expect (f).toBe (false)

})