const createError = require ('http-errors')
const {JobSource} = require ('doix')
const {HttpRequestContext} = require ('http-server-tools')
const {Router: {PROCESS_MESSAGE, TEST_MESSAGE}} = require ('protocol-agnostic-router')

class WebService extends JobSource {

	constructor (app, o) {

		super (app, o)
		
		{
		
			const {location} = o; if (location != null) {
				
				const CH_SLASH = 47
			
				if ('test' in o) throw Error ('`location` and `test` cannot be set at once')
				
				if (location instanceof RegExp) {

					o.test = response => location.test (response.req.url)

				}
				else if (typeof location === 'string') {
				
					const {length} = location; if (length === 0) throw Error ('location cannot be empty')

					if (location.charCodeAt (0) !== CH_SLASH) throw Error ('location must start with a slash')
										
					const endsWithSlash = location.charCodeAt (length - 1) === CH_SLASH

					o.test = ({req: {url}}) => {
					
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

		if ('test' in o) this [TEST_MESSAGE] = o.test

		this.methods = o.methods

		if ('getRequest' in o) this.getRequest = o.getRequest

		this.ctxOptions = {}

		for (const k of [

			'parse',
			'stringify',
			'createError',

			'maxBodySize',
			'pathMapping',
			'keepBody',

			'statusCode',
			'charset',
			'contentType',

		]) if (k in o) this.ctxOptions [k] = o [k]

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
		
	validate (http) {

		this.validateMethod (http)

	}

	validateMethod (http) {

		if (!this.methods.includes (http.request.method)) throw createError (405)

	}

	async onJobInit (job) {

		const {http} = job

		this.validate (http)

		await job.http.readBody ()

		job.request = this.getRequest (http)

	}

	[PROCESS_MESSAGE] (response) {

		const job = this.createJob (), ctx = new HttpRequestContext (response, this.ctxOptions)
		
		job.http = ctx
		
		const 
			OK = () => {},
			FAIL = err => {
				this.emit ('error', err)
				ctx.response.end ()
			}

		job.outcome ().then (
			res => ctx.write (res ?? null).then (OK, FAIL),
			err => ctx.writeError    (err).then (OK, FAIL)
		)
	
	}

}

module.exports = WebService