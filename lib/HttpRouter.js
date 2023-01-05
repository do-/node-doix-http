const http               = require ('http')
const {Router}           = require ('doix')
const HttpRequestContext = require ('./HttpRequestContext.js')
const HttpRouterEventLogger = require ('./HttpRouterEventLogger.js')

class HttpRouter extends Router {

	constructor (o) {
	
		super ()
	
		this.listenOptions = o.listen

		this.server = http.createServer (o.server || {})

			.on ('request', (request, response) => this.process (new HttpRequestContext (request, response)))
			
		if (o.logger) new HttpRouterEventLogger (this, o.logger)

	}
	
	listen () {

		super.listen ()
	
		this.server.listen (this.listenOptions)

		this.emit ('start')
	
	}

}

module.exports = HttpRouter