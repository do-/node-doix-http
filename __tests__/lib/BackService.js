const {WebService, HttpParamReader, HttpResultWriter} = require ('../..')

module.exports = class extends WebService {

	constructor (app, o) {
		
	    super (app, {

			name: 'webBackEnd',
	    
			methods: ['POST'],

			reader: new HttpParamReader ({
				from: {
					searchParams: true,
					bodyString: s => JSON.parse (s),
				}
			}),

			on: {

				error : function (error) {

					if (typeof error === 'string') error = Error (error)
					
					while (error.cause) error = error.cause
					
					this.error = error

				},

			},

			writer: new HttpResultWriter ({

				type: 'application/json',

				stringify: content => {
				
					return JSON.stringify ({
						success: true, 
						content, 
					})
				
				}

			}),

			dumper: new HttpResultWriter ({

				code: err =>

					/^[1-5]\d\d$/.test (err.statusCode) ? err.statusCode :

					500,

				type: 'application/json',

				stringify: (err, job) => JSON.stringify (
					{
						success: false,
						id: job.id,
						dt: new Date ().toJSON ()
					}
				)
				
			}),
			
			...o

	    })

	}

}