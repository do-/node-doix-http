const {randomUUID} = require ('crypto')
const util         = require ('util')

const SEP = '; '
const SESSION_ID   = Symbol ('sessionId')
const OLD_USER     = Symbol ('oldUser')

class CookieSession {

	constructor (o = {}) {

		this.name = o.name || 'sid'

		this.ttl  = o.ttl  ||  30

	}

	setHeader (http, value) {

		http.setCookie (this.name, value, {httpOnly: true})

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

		this.setHeader (job.http, '')

	}

	async writeAuthResponse (job) {

		const {user} = job, id = await this.getOutgoingSessionId (job)

		if (!util.isDeepStrictEqual (user, job [OLD_USER])) await this.storeUser (id, user, this.getDb (job))

		this.setHeader (job.http, id)

	}
	
	plugInto (ws) {

		const session = this

		ws.addHandler ('init',  function () {this.waitFor (session.readRequest   (this))})

		ws.addHandler ('end',   function () {this.waitFor (session.writeResponse (this))})

	}

}

module.exports = CookieSession