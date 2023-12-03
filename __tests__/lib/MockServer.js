const http = require ('http')
const {HttpRouter} = require ('../..')
const {ConsoleLogger} = require ('doix')

let port = 8010

module.exports = {

	getResponse: async function (o) {

		if (!o.listen) o.listen = {}
		if (!o.listen.host) o.listen.host = '127.0.0.1'
		if (!o.listen.port) o.listen.port = ++ port

		if (!o.requestOptions) o.requestOptions = {}
		if (o.requestOptions.body == null) o.requestOptions.body = ''

		const {listen, service, path, requestOptions} = o

		try {

			var r = new HttpRouter ({listen, logger: ConsoleLogger.DEFAULT})
			
			for (const s of Array.isArray (service) ? service : [service]) r.add (s)

			r.listen ()

			const rp = await new Promise ((ok, fail) => {

				const rq = http.request (`http://${listen.host}:${listen.port}${path}`, requestOptions, ok)

				rq.end (requestOptions.body)

			})

			const a = []; for await (b of rp) a.push (b)

			rp.responseText = Buffer.concat (a).toString ()
			
			if (rp.headers ['content-type'] === 'application/json; charset=utf-8') rp.responseJson = JSON.parse (rp.responseText)

			return rp

		}
		finally {

			await r.close ()

		}

	}

}