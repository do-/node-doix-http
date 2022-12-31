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

}

module.exports = HttpRequestContext