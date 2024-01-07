const {randomUUID} = require ('crypto')
const util         = require ('util')
const Cookie       = require ('./Cookie.js')

const SESSION_ID   = Symbol ('sessionId')
const OLD_USER     = Symbol ('oldUser')

class CookieSession extends Cookie {

	constructor (o) {

		super (o)

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

		const id = this.getRaw (job.http.request); if (!id) return

		job [OLD_USER] = job.user = await this.getUserBySessionId (id, this.getDb (job))

		await this.setSessionId (id, job)

	}
	
	async writeResponse (job) {

		return job.user ? this.writeAuthResponse (job) : this.writeAnonResponse (job)

	}

	async writeAnonResponse (job) {

		const {http: {response}} = job

		const id = await this.getIncomingSessionId (job); if (id) await this.finishSession (id, this.getDb (job))

		this.setRaw (response, '')

	}

	async writeAuthResponse (job) {

		const {user, http: {response}} = job, id = await this.getOutgoingSessionId (job)

		if (!util.isDeepStrictEqual (user, job [OLD_USER])) await this.storeUser (id, user, this.getDb (job))

		this.setRaw (response, id)

	}
	
	plugInto (ws) {

		const session = this

		ws.addHandler ('start', function () {this.waitFor (session.readRequest   (this))})

		ws.addHandler ('end',   function () {this.waitFor (session.writeResponse (this))})

	}

}

module.exports = CookieSession