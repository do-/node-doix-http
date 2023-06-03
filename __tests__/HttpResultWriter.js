const {HttpResultWriter} = require ('..')

test ('constructor', () => {

	expect (new HttpResultWriter ()).toBeInstanceOf (HttpResultWriter)
	
	expect (new HttpResultWriter ({encoding: 'latin-1'}).encoding).toBe ('latin-1')

})

