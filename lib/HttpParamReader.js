const {ObjectMerger} = require ('subclassable-object-merger')

class HttpParamReader {

	constructor (o = {}) {

		for (const [k, v] of Object.entries (o)) if (v !== undefined) switch (k) {

			case 'from':
				if (!(v instanceof Object)) throw new Error ('Only Object or its descendant can be used as `from`')
				this.from = v
				break

			case 'merger':
				if (!(v instanceof ObjectMerger)) throw new Error ('Only ObjectMerger or its descendant can be used as merger')
				this.merger = v
				break

			default:
				throw new Error ('Unknown HttpParamReader option: ' + k)

		}
		
		if (!('from' in this)) this.from = {}

		if (!('merger' in this)) this.merger = new ObjectMerger ()

	}
	
	async toReadBodyAsString (job) {

		const body = await job.http.getBodyAsString ()
		
		const vars = this.from.bodyString (body, job)
				
		this.merger.merge (job.rq, vars)

	}
	
	readSearchParams (job) {

		const {http, rq} = job

		for (const [k, v] of http.searchParams) rq [k] = v

	}

	process (job) {
	
		const {http, rq} = job, {from} = this

		if (from.searchParams) this.readSearchParams (job)
		
		if (
			http.request.method.charCodeAt (0) === 80 // P[OST|UT|ATCH]
			&& from.bodyString
		) job.on ('start', () => job.waitFor (this.toReadBodyAsString (job)))

	}

}

module.exports = HttpParamReader