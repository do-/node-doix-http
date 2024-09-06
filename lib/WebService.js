const createError = require ('http-errors')
const {JobSource} = require ('doix')
const {HttpRequestContext} = require ('http-server-tools')
const {Router: {PROCESS_MESSAGE, TEST_MESSAGE}} = require ('protocol-agnostic-router')

class WebService extends JobSource {

	constructor (app, o) {

		super (app, o)

		{

			const {methods} = o

			if (methods == null) throw Error ('The `methods` option is not set')

			if (!Array.isArray (methods)) throw Error ('The `methods` option must be an array')

			if (methods.length === 0) throw Error ('The `methods` list is empty')

			this.methods = methods

		}
		
		{
		
			const {location} = o; if (location != null) {
				
				const CH_SLASH = 47
			
				if ('test' in o) throw Error ('`location` and `test` cannot be set at once')
				
				if (location instanceof RegExp) {

					o.test = req => location.test (req.url)

				}
				else if (typeof location === 'string') {
				
					const {length} = location; if (length === 0) throw Error ('location cannot be empty')

					if (location.charCodeAt (0) !== CH_SLASH) throw Error ('location must start with a slash')
										
					const endsWithSlash = location.charCodeAt (length - 1) === CH_SLASH

					o.test = ({url}) => {
					
						if (url === location) return true
						
						if (url.slice (0, length) !== location) return false
						
						if (endsWithSlash) return false

						return url.charCodeAt (length) === CH_SLASH
											
					}

					o.pathBase = location.split ('/').filter (s => s.length !== 0).length

				}
				else {

					throw Error ('Invalid location: ' + location)

				}
			
			}
		
		}

		if ('test' in o) this [TEST_MESSAGE] = response => o.test (response.req)

		if ('getRequest' in o) this.getRequest = o.getRequest

		this.ctxOptions = {pathBase: 0}

		for (const k of [

			'parse',
			'stringify',
			'createError',

			'maxBodySize',
			'pathBase',
			'pathMapping',
			'keepBody',

			'statusCode',
			'charset',
			'contentType',

		]) if (k in o) this.ctxOptions [k] = o [k]

		this [PROCESS_MESSAGE] = this.process

	}

	getRequest ({
		bodyParams, 
		searchParams, 
		pathParams
	}) {

		return {
			...bodyParams, 
			...searchParams, 
			...pathParams
		}

	}
		
	createHttpContext (response) {

		const END = () => response.end ()

		const http = new HttpRequestContext (response, this.ctxOptions)

		try {

			this.validateHttpContext (http)

			return http

		}
		catch (err) {

			http.writeError (err).then (END, END)

			throw err

		}

	}

	validateHttpContext (http) {

		this.validateHttpMethod (http)

	}

	validateHttpMethod (http) {

		if (!this.methods.includes (http.request.method)) throw createError (405)

	}

	async onJobInit (job) {

		const {http} = job

		await job.http.readBody ()

		const r = this.getRequest (http); for (const k in r) job.request [k] = r [k]

	}

	async onJobEnd (job) {

		await job.http.write (job.result)

	}

	async onJobError (job) {

		const {http, error} = job

		delete job.error

		await http.writeError (error)

	}

	process (response) {

		const END = () => response.end ()

		const http = this.createHttpContext (response)

		const job = this.createJob (); job.http = http

		job.outcome ().then (END,
			err => {
				this.emit ('error', err)
				response.statusCode = 500
				END ()
			}
		)
	
	}

}

module.exports = WebService