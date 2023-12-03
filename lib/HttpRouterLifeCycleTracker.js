const {LifeCycleTracker} = require ('doix')

class HttpRouterLifeCycleTracker extends LifeCycleTracker {

	constructor (router, logger) {

		super (router, logger)

		this.prefix = router.uuid

		this.postfix = ' listening for HTTP at ' + JSON.stringify (router.listenOptions)

	}

	startMessage () {

		return super.startMessage () + this.postfix

	}

}

module.exports = HttpRouterLifeCycleTracker