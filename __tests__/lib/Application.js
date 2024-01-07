const {Application, ConsoleLogger} = require ('doix')

const BackService = require ('./BackService.js')

module.exports = class extends Application {

	constructor (conf) {
					
	    super ({
	    	
	    	logger: ConsoleLogger.DEFAULT,
/*	    

			pools: {
			},
*/
			modules: {
				dir: {
					root: [__dirname],
					filter: (str, arr) => arr.at (-1) === 'Content',
				},
			},

	    })

		this.sessions = {}

	}
	
	createBackService (o = {}) {

		return new BackService (this, o)
	
	}

}