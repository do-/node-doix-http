class HttpResultWriter {

	constructor (o = {}) {
	
		for (const k of ['code', 'type', 'encoding', 'stringify']) 
		
			if (k in o) 
			
				this [k] = o [k]
		
		if (!('encoding' in this)) this.encoding = 'utf-8'
		
	}
	
	process (job) {
	
		const {http} = job, result = job [this.field]

		let o = {}; for (const k of ['code', 'type', 'encoding']) if (k in this) {
		
			let v = this [k]
			
			if (typeof v === 'function') v = v (result, job)
		
			o [k] = v

		}

		http.writeString (this.stringify (result, job), o)

	}

}

module.exports = HttpResultWriter