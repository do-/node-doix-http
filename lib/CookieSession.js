const {randomUUID} = require ('crypto')
const util         = require ('util')

const SESSION_ID   = Symbol ('sessionId')
const OLD_USER     = Symbol ('oldUser')

class CookieSession {

	constructor (o) {

		if (o == null) throw Error ('Options not set')
		if (typeof o !== 'object') throw Error ('Invalid options: ' + o)

		{
			const {name} = o
			if (name == null) throw Error ('Cookie name not set')
			if (typeof name !== 'string') throw Error ('Not a string as cookie name: ' + name)
			if (name.length === 0) throw Error ('Empty cookie name')
			this.name = name
		}

		{

			let {attr} = o; attr = attr ?? {}

			if ('expires' in attr) throw Error ('The `Expires` header must not be set here')
			if ('maxAge' in attr)  throw Error ('The `Max-Age` header is calculated, not to be set explicitly')
								
			if (!('httpOnly' in attr)) attr.httpOnly = true

			this.attr = attr
	
		}

		{
			const {ttl} = o
			if (ttl == null) throw Error ('TTL not set')
			if (!Number.isSafeInteger (ttl)) throw Error ('TTL must be a safe integer')
			if (ttl <= 0) throw Error ('TTL must be positive')
			this.ttl = ttl
			this.attr.maxAge = 60 * ttl
		}

	}

	getDb (job) {

		// do nothing; may be overridden

	}

	async getNewSessionId (job) {
		
		return randomUUID ()
		
	}

	async getIncomingSessionId (job) {

		return job [SESSION_ID]

	}

	async setSessionId (id, job) {

		job [SESSION_ID] = id

	}

	async getOutgoingSessionId (job) {

		const id = await this.getIncomingSessionId (job); 
		
		if (id) return id

		return this.getNewSessionId (job)

	}

	async getUserBySessionId (id, db) {

		throw Error ('Not implemented')

	}

	async storeUser (id, user, db) {

		// do nothing; may be overridden

	}

	async finishSession (id, db) {

		// do nothing; may be overridden

	}

	async readRequest (job) {

		const id = job.http.cookieParams [this.name]; if (!id) return

		job [OLD_USER] = job.user = await this.getUserBySessionId (id, this.getDb (job))

		await this.setSessionId (id, job)

	}
	
	async writeResponse (job) {

		return job.user ? this.writeAuthResponse (job) : this.writeAnonResponse (job)

	}

	async writeAnonResponse (job) {

		const id = await this.getIncomingSessionId (job); if (id) await this.finishSession (id, this.getDb (job))

		job.http.setCookie (this.name, '', {...this.attr, maxAge: 0})

	}

	async writeAuthResponse (job) {

		const {user} = job, id = await this.getOutgoingSessionId (job)

		if (!util.isDeepStrictEqual (user, job [OLD_USER])) await this.storeUser (id, user, this.getDb (job))

		job.http.setCookie (this.name, id, this.attr)

	}
	
	plugInto (ws) {

		const session = this

		ws.addHandler ('init',  function () {this.waitFor (session.readRequest   (this))})

		ws.addHandler ('end',   function () {this.waitFor (session.writeResponse (this))})

	}

}

module.exports = CookieSession