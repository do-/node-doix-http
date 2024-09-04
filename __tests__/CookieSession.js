const {CookieSession} = require ('..')
 
test ('rudimentary', async () => {

	expect (() => new CookieSession ()).toThrow ()
	expect (() => new CookieSession (0)).toThrow ()

	const s = new CookieSession ({})

	expect (await s.getDb ()).toBeUndefined ()
	expect (await s.storeUser ()).toBeUndefined ()
	expect (await s.finishSession ()).toBeUndefined ()

	await expect (s.getUserBySessionId ()).rejects.toThrow ()

})
