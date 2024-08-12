const http               = require ('http')
const {Router}           = require ('doix')
const HttpRequestContext = require ('./HttpRequestContext.js')
const {Tracker}          = require ('events-to-winston')

class HttpRouter extends Router {

	constructor (o) {
	
		super ()
	
		this.listenOptions = o.listen

		this.server = http.createServer (o.server || {})

			.on ('request', (request, response) => this.process (new HttpRequestContext (request, response)))
			
		if (o.logger) {

			this.tracker = new Tracker (this, o.logger)

			this.tracker.listen ()

		}

	}
	
	listen () {

		super.listen ()
	
		this.server.listen (this.listenOptions)

		this.emit ('start')
	
	}

	async close () {
	
		await this.server.close ()

		this.emit ('finish')
	
	}

}

module.exports = HttpRouter