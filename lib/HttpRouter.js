const http               = require ('http')
const {Router}           = require ('doix')
const HttpRequestContext = require ('./HttpRequestContext.js')

class HttpRouter extends Router {

	constructor (o) {
	
		super ()
	
		this.listenOptions = o.listen

		this.server = http.createServer (o.server || {})

			.on ('request', (request, response) => this.process (new HttpRequestContext (request, response)))
	
	}
	
	listen () {
	
		this.server.listen (this.listenOptions)
	
	}

}

module.exports = HttpRouter