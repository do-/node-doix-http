const {HttpParamReader} = require ('..')
const {ObjectMerger} = require ('subclassable-object-merger')

test ('constructor', () => {

	expect (new HttpParamReader ()).toBeInstanceOf (HttpParamReader)

	expect (new HttpParamReader ({0: undefined, merger: new ObjectMerger ()})).toBeInstanceOf (HttpParamReader)

	expect (() => new HttpParamReader ({from: 0})).toThrow ()

	expect (() => new HttpParamReader ({merger: 0})).toThrow ()

	expect (() => new HttpParamReader ({'': 0})).toThrow ()

})

test ('from', () => {

	const job = {on: x => x, http: {request: {method: 'TRACE'}}}

	new HttpParamReader ().process (job)

})

