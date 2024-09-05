const http          = require ('http')
const winston       = require ('winston')
const {Application} = require ('doix')
const {WebService}  = require ('..')

const root = __dirname, host = '127.0.0.1', port = 9000

const logger = winston.createLogger ({transports: [new winston.transports.Console ()]})
const app    = new Application ({modules: {dir: {root}}, logger})

test ('200', async () => {

	const ws  = new WebService (app, {name: 'ws', methods: ['GET']})
	const srv = new http.Server ((_, res) => ws.process (res)).listen ({host, port})

	const rp = await new Promise (ok => http.request (`http://${host}:${port}/?type=users`, {}, ok).end ())
	const a = []; for await (b of rp) a.push (b)

	expect (rp.statusCode).toBe (200)
	expect (Buffer.concat (a).toString ()).toBe ('[]')

	srv.close ()

})