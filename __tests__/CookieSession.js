const {CookieSession} = require ('..')
 
test ('rudimentary', async () => {

	expect (() => new CookieSession ()).toThrow ()
	expect (() => new CookieSession (0)).toThrow ()
	expect (() => new CookieSession ({})).toThrow ()
	expect (() => new CookieSession ({name: 0})).toThrow ()
	expect (() => new CookieSession ({name: ''})).toThrow ()
	expect (() => new CookieSession ({name: 'sid'})).toThrow ()
	expect (() => new CookieSession ({name: 'sid', ttl: '30'})).toThrow ()
	expect (() => new CookieSession ({name: 'sid', ttl: Infinity})).toThrow ()
	expect (() => new CookieSession ({name: 'sid', ttl: 0})).toThrow ()
	expect (() => new CookieSession ({name: 'sid', ttl: 30, attr: {expires: new Date ()}})).toThrow ()
	expect (() => new CookieSession ({name: 'sid', ttl: 30, attr: {maxAge: 1000}})).toThrow ()

	const s = new CookieSession ({name: 'sid', ttl: 30})

	expect (s.attr.httpOnly).toBe (true)
	expect (s.attr.maxAge).toBe (1800)

	expect (await s.getDb ()).toBeUndefined ()
	expect (await s.storeUser ()).toBeUndefined ()
	expect (await s.finishSession ()).toBeUndefined ()

	await expect (s.getUserBySessionId ()).rejects.toThrow ()

	expect (new CookieSession ({name: 'sid', ttl: 30, attr: {httpOnly: false}}).attr.httpOnly).toBe (false)

})
