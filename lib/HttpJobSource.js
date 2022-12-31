const {JobSource} = require ('doix')

class HttpJobSource extends JobSource {

	constructor (app, o = {}) {

		super (app, o)
			
		this.methods = o.methods
		
		this.reader  = o.reader

		this.addHandler ('error', job => this.returnError  (job))

		this.addHandler ('end',   job => this.returnResponse (job))

	}
		
	check (job) {

		if (!this.methods.includes (job.http.request.method)) {
		
			let x = new Error ()
			
			x.statusCode = 405
			
			throw x
		
		}

	}
	
	process (http) {
		
		const job = this.app.createJob ()
		
		job.http = http
		
		if (this.reader) this.reader.process (job)
				
		this.copyHandlersTo (job)

		try {

			this.check (job)

		}
		catch (x) {

			job.on ('start', j => j.fail (x))

		}

		job.toComplete ().catch (darn)

	}
	
	returnResponse (job) {

		let {result, http: {response}} = job

		response.writeHead (200)

		response.end (result)

	}
	
	returnError (job) {

		let {error, http: {response}} = job

		if (!(error instanceof Error)) error = new Error ('' + error)

		job.error = undefined

		response.writeHead (error.statusCode || 500)

		if (error.expose) response.end (error.message); else response.end ()

	}
	
}

module.exports = HttpJobSource