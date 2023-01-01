const fs = require ('fs')
const Path = require ('path')
const EventEmitter = require ('events')

class HttpStaticSite extends EventEmitter {

	constructor (o) {
	
		super ()

		this.root = o.root

		this.index = o.index || 'index.html'
		
		this.mime = new Map (this.ext2mime ())

	}
	
	* ext2mime () {

		for (const [type, {extensions}] of Object.entries (require ('mime-db'))) 
		
			if (extensions)
			
				for (const extension of extensions)
				
					yield [extension, type]

	}
	
	assertExists (path) {

		if (fs.existsSync (path)) return

		throw Error ('Not found: ' + path)

	}

	process (http) {

		try {
		
			const {request, response} = http

			let path = Path.join (this.root, request.url)

			this.assertExists (path)
					
			if (fs.statSync (path).isDirectory ()) path = Path.join (path, this.index)

			this.assertExists (path)
			
			{
			
				const ext = Path.extname (path); if (ext) {
				
					const type = this.mime.get (ext.slice (1))
					
					if (type) response.setHeader ('Content-Type', type);
				
				}
			
			}

			response.setHeader ('Content-Length', fs.statSync (path).size)
			
			http.writeStream (fs.createReadStream (path))
		
		}
		catch (x) {

			http.writeString ('Not found', {code: 404})
			
			this.emit ('error', x)
		
		}

	}

}

module.exports = HttpStaticSite