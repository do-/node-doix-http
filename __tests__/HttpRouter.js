const {HttpRouter} = require ('..')

const {Writable} = require ('stream')
const winston = require ('winston')
const logger = winston.createLogger({
	transports: [
//	  new winston.transports.Console (),
	  new winston.transports.Stream ({stream: new Writable ({write(){}})})
	]
})

test ('listen', async () => {

	const r = new HttpRouter ({name: 'httpEndPoint', logger, listen: {port: 8002}})
		
	let f = false
	
	r.on ('start', () => f = true)
	r.on ('finish', () => f = false)

	expect (f).toBe (false)
		
	r.listen ()

	expect (f).toBe (true)

	await r.close ()

	expect (f).toBe (false)

})