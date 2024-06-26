const {JobSource} = require ('doix')

class WebService extends JobSource {

	constructor (app, o) {

		super (app, o)
		
		{
		
			const {location} = o; if (location != null) {
				
				const CH_SLASH = 47
			
				if ('test' in o) throw Error ('`location` and `test` cannot be set at once')
				
				if (location instanceof RegExp) {

					o.test = http => location.test (http.request.url)

				}
				else if (typeof location === 'string') {
				
					const {length} = location; if (length === 0) throw Error ('location cannot be empty')

					if (location.charCodeAt (0) !== CH_SLASH) throw Error ('location must start with a slash')
										
					const endsWithSlash = location.charCodeAt (length - 1) === CH_SLASH

					o.test = ({request: {url}}) => {
					
						if (url === location) return true
						
						if (url.slice (0, length) !== location) return false
						
						if (endsWithSlash) return false

						return url.charCodeAt (length) === CH_SLASH
											
					}
					
				}
				else {

					throw Error ('Invalid location: ' + location)

				}
			
			}
		
		}

		for (const k of ['methods', 'test', 'reader', 'writer', 'dumper']) 
		
			if (k in o) 
			
				this [k] = o [k]
		
		this.writer.field = 'result'
		this.dumper.field = 'error'
		
	}
		
	check (job) {

		if (!this.methods.includes (job.http.request.method)) {
		
			let x = new Error ()
			
			x.statusCode = 405

			throw x
		
		}

	}
	
	process (http) {
		
		const job = this.createJob ()
		
		job.http = http
		
		this.reader.process (job)
		
		try {

			this.check (job)

		}
		catch (x) {

			job.on ('start', () => job.fail (x))

		}

		job.toComplete ().then (
			() => this.returnResponse (job),
			() => this.returnError (job)
		)

	}
	
	returnResponse (job) {

		this.writer.process (job)

	}
	
	returnError (job) {

		this.dumper.process (job)

		job.waitFor (new Promise ((ok, fail) => ok (job.error = undefined)))

	}
	
}

module.exports = WebService