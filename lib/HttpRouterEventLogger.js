const {EventLogger} = require ('doix')

class HttpRouterEventLogger extends EventLogger {

	constructor (router, logger) {

		super (router)

		this.router = router
		this.logger = logger
		this.prefix = this.uuid

	}

	startMessage () {

		return this.message ('started listening for HTTP at ' + JSON.stringify (this.router.listenOptions))

	}

	errorMessage (x) {
	
		return this.message (this.errorToString (x), 'error')
		
	}

}

module.exports = HttpRouterEventLogger