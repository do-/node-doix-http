const URL = require ('url'), {URLSearchParams} = URL

class HttpRequestContext {

	constructor (request, response) {

		this.request = request

		this.response = response

	}

	get searchParams () {

		return new URLSearchParams (

			URL.parse (this.request.url).search

		).entries ()

	}

	async getBodyAsString () {
	
		const {request} = this
	
		let buffers = []; await new Promise ((ok, fail) => request
			.on ('error', fail)
			.on ('end', ok)
			.on ('data', buffer => buffers.push (buffer))
		)
		
		return (Buffer.concat (buffers)).toString ()
	
	}

}

module.exports = HttpRequestContext