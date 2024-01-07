const {CookieSession} = require ('..')
 
test ('rudimentary', async () => {

	const s = new CookieSession ()

	expect (await s.getDb ()).toBeUndefined ()
	expect (await s.storeUser ()).toBeUndefined ()
	expect (await s.finishSession ()).toBeUndefined ()

	await expect (s.getUserBySessionId ()).rejects.toThrow ()

})
