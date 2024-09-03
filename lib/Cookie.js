const SEP = '; '

class Cookie {

	constructor (o = {}) {
		
		this.name = o.name || 'sid'

		this.ttl  = o.ttl  ||  30
	
	}

	getRaw (request) {

		const {cookie} = request.headers; if (!cookie) return null

		const 
			{name} = this, 
			s      = SEP + cookie + SEP, 
			head   = SEP + name + '=',
			pos    = s.indexOf (head)

		return /*pos === -1 ? null :*/ s.substring (pos + head.length, s.indexOf (SEP, pos + 1))

	}

	setRaw (response, value) {

		response.setHeader ('Set-Cookie', this.name + '=' + value + '; HttpOnly')

	}
	
}

module.exports = Cookie