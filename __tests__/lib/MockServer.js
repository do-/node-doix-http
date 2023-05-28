const http = require ('http')
const {HttpRouter} = require ('../..')
const {ConsoleLogger} = require ('doix')

module.exports = {

	getResponse: async function (o) {

		if (!o.listen) o.listen = {}
		if (!o.listen.host) o.listen.host = '127.0.0.1'
		if (!o.listen.port) o.listen.port = 8000

		if (!o.requestOptions) o.requestOptions = {}

		const {listen, service, path, requestOptions} = o

		try {

			var r = new HttpRouter ({listen, logger: ConsoleLogger.DEFAULT})

			r.add (service)

			r.listen ()

			const rp = await new Promise ((ok, fail) => {

				service.on ('error', () => 0)

				const rq = http.request (`http://${listen.host}:${listen.port}${path}`, requestOptions, ok)

				rq.end ()

			})

			const a = []; for await (b of rp) a.push (b)

			rp.responseText = Buffer.concat (a).toString ()

			return rp

		}
		finally {

			await r.close ()

		}

	}

}