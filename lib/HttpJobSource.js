const {JobSource} = require ('doix')

class HttpJobSource extends JobSource {

	constructor (app, o = {}) {

		super (app, o)
		
		for (const k of ['methods', 'test', 'reader', 'writer', 'dumper']) 
		
			if (k in o) 
			
				this [k] = o [k]
		
		this.writer.field = 'result'
		this.dumper.field = 'error'
		
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

		this.writer.process (job)

	}
	
	returnError (job) {

		this.dumper.process (job)

		job.waitFor (new Promise ((ok, fail) => ok (job.error = undefined)))

	}
	
}

module.exports = HttpJobSource