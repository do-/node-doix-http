const {CookieSession} = require ('../..')

module.exports = class extends CookieSession {

	constructor (options = {}) {

		super ({
			name: 'sid',
			ttl: 30,
			...options
		})

	}

	getDb (job) {

		return job.app.sessions

	}

	async getUserBySessionId (id, db) {

		return db [id]

	}

	async storeUser (id, user, db) {

		db [id] = user

	}

	async finishSession (id, db) {

		delete db [id]

	}

}