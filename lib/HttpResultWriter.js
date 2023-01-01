const {JobSource, ObjectMerger} = require ('doix')

class HttpResultWriter {

	constructor (o = {}) {
	
		for (const k of ['type', 'encoding', 'stringify']) 
		
			if (k in o) 
			
				this [k] = o [k]
		
		if (!('encoding' in this)) this.encoding = 'utf-8'
		
	}
	
	process (job) {
	
		const {http, result} = job

		let o = {}; for (const k of ['type', 'encoding']) if (k in this) o [k] = this [k]

		http.writeString (this.stringify (result), o)

	}

}

module.exports = HttpResultWriter