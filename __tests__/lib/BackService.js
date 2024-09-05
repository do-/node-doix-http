const {WebService} = require ('../..')
const {Job} = require ('doix')
const createError          = require ('http-errors')
const {HttpRequestContext} = require ('http-server-tools')
const {Readable} = require ('stream')
module.exports = class extends WebService {

	constructor (app, o) {
		
	    super (app, {

			name: 'webBackEnd',
	    
			methods: ['POST'],

//			stringify: content => JSON.stringify ({success: true, content}),

			createError: cause => {

				const o = {success: false, dt: new Date ()}

				const {INSTANCE} = Job; if (INSTANCE in cause) o.id = cause [INSTANCE].id

				const error = createError (500, JSON.stringify (o))

				error.expose = true

				error [HttpRequestContext.CONTENT_TYPE] = 'application/json'

				return error

			},

			on: {

				end: function () {

					if (this.result instanceof Readable) return

					this.result = {success: true, content: this.result ?? null}

				}

			},
		
			...o

	    })

	}

}