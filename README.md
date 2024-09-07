![workflow](https://github.com/do-/node-doix-http/actions/workflows/main.yml/badge.svg)
![Jest coverage](./badges/coverage-jest%20coverage.svg)

`doix-http` is an addon for [`doix`](https://github.com/do-/node-doix) framework for adding [Web services](https://www.w3.org/TR/ws-arch/) to `doix` [applications](https://github.com/do-/node-doix/wiki/Application).

# Basic usage
In this section, a trivial sample echo service is used to illustrate some of the framework's basic concepts. 

## Prerequisites
### Installation
First, as usual:
```
npm init
npm install doix-http
```
### Application Code
Next, create a module that implements the necessary business logic. Make a directory, it's path will be referred as `root`. Put a file called `${root}/Echo.js` in there:
```js
module.exports = {
  getList: function () {
    return this.request
  },
}
```
Here, `this` is an instance of `doix` [`Job`](https://github.com/do-/node-doix/wiki/Job), so `this.request` is the collection of all incoming parameters (loosely based on [PHP's `$_REQUEST`](https://www.php.net/manual/en/reserved.variables.request.php)).

The method name `getList` here is determined by the application's [naming conventions](https://github.com/do-/node-doix/wiki/NamingConventions). Feel free to change it if necessary.

### `index.js` Preamble
In the directory where `npm init` was executed, place the file named `index.js` which contains:
```js
const root = '...', host = '127.0.0.1', port = 8000 // or read them from some config file

const http          = require ('http')
const winston       = require ('winston')
const {Application} = require ('doix')
const {WebService}  = require ('doix-http')

const logger = winston.createLogger ({transports: [new winston.transports.Console ()]})
const app    = new Application ({modules: {dir: {root}}, logger})
// now, the service...
```

Creating a [winston](https://github.com/winstonjs/winston) logger is required here, as `doix` uses it to automatically [watch on everything](https://github.com/do-/node-events-to-winston).

## Creating the Web Service
Now, append the following lines to the `index.js`:
### Standalone
```js
// now, the service...
const ws  = new WebService (app, {name: 'ws', methods: ['GET', 'POST']})
const srv = new http.Server ((_, res) => ws.process (res))
srv.listen ({host, port})
```
Run it and check `http://127.0.0.1:8000/?type=echo`. The response body must be `{"type":"echo"}`. The `type` value refers to the module name (so, the filename `'Echo.js'`). Without it, you'll get the [500 Internal Server Error](https://developer.mozilla.org/ru/docs/Web/HTTP/Status/500).

Add some more search parameters (but not `id`, `action` and `part`, as they [affect](https://github.com/do-/node-doix/wiki/NamingConventions) the choice of method), and watch them appear in the response. Try some `POST` requests with valid JSON as body: this content will be merged with the parameters read from the URL string.

### Plugged into a Router
In the example above, the bare standard [http.Server](https://nodejs.org/docs/latest/api/http.html#class-httpserver) just feeds incoming [http.ServerResponse](https://nodejs.org/docs/latest/api/http.html#class-httpserverresponse) instances to the [`ws.process`](https://github.com/do-/node-doix-http/wiki/WebService#process-response) method. It basically works, but to further develop such code in a maintainable way, one absolutely need to add here at least some logging and error handling. Having multiple services with the same host:port, distinct by some conditions on the URL is, too, a must.

There are lots of solutions to the above problems. Here, we'll stick with one of them, the [`HttpRouter`](https://github.com/do-/node-protocol-agnostic-router/wiki/HttpRouter), from a companion module to be installed separately first:

```sh
npm install protocol-agnostic-router
```

That done, we can rewrite the ending of our script as

```js
// now, the service...
const {HttpRouter}  = require ('protocol-agnostic-router')

const router = new HttpRouter ({name: 'EndPoint', listen: {host, port}, logger})
router.add (new WebService (app, {name: 'ws', location: '/api-v1', methods: ['GET', 'POST']}))
// router.add (new WebService (app, {name: 'ws1', location: '/api-v2', methods: ['GET', 'POST']}))

router.listen ()
```

The same (easily replaceable) winston logger is used to track the life cycle of the router, including intercepted errors. Multiple virtual hosts can be added at once (not necessarily WebService instances, but anything capable of handling `response` objects).

# Options Reference
Having shown the very basic case of `WebService` working somehow, we now present the complete example of its constructor call with all possible options (most of which belong to either [JobSource](https://github.com/do-/node-doix/wiki/JobSource) or [HttpRequestContext](https://github.com/do-/node-http-server-tools/wiki)):
```js
const ws = new WebService (app, {

        name: 'myEndPoint',

//      location: '/my-end-point/',
// OR	test: req => req.url.slice (0, 4) === '/roo',

	methods: ['POST'],
	
//      request     : {},
//      getRequest  : http => {...http.pathParams, ...http.searchParams, ...http.bodyParams},
//      parse       : str => JSON.parse (str),        // for .bodyParams
//      keepBody    :       // when NOT to read it, e.g. function () {return this.path [0] === '~raw'},
//      maxBodySize : 10 * 1024 * 1024,
//      pathBase    : 0,
//      pathMapping :       // `path` => `pathParams`, e.g. ([type, id]) => ({type, id})

//      statusCode  : 200,
//      contentType : 'application/json',
//      charset     : 'utf-8',
//      stringify   : obj => JSON.stringify (obj),    // for .write ({...})
//      createError : err => createError (500, err, {expose: false}),

//	on:         {
//        init:    [],
//        start:   [],
//        end:     [
//          // e.g. async function () {this.result = this.result ?? {}}
//        ],
//        error:   [],
//        finish:  [],
//      },

//      maxLatency: Infinity,
//      maxPending: Infinity,

//	globals:    {},
//	generators: {},
//      pools:      {},
//      logger:     app.logger,

})
```

Here, 
* uncommented lines show mandatory parameters with sample values;
* commented ones are for omittable options and:
  * explicit values (like for `maxBodySize`) show hardcoded defaults; 
  * second comments with _e.g._ (see `pathMapping`) suggest some usable values where no default is set.

In the following, each option is described in detail.

## Core
### `name`
The unique name of this Web service among all [job sources](https://github.com/do-/node-doix/wiki/JobSource) in the containing [Application](https://github.com/do-/node-doix/wiki/Application).

Simply put, the technical name to appear in logs.
### `methods`
The mandatory non empty array of [HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods), uppercase, to detect requests subject to be closed with [405 Method Not Allowed](https://developer.mozilla.org/ru/docs/Web/HTTP/Status/405) without any further processing.

## Reading Request
Options from this section affect the way the object visible as `this.request` is constructed from the incoming HTTP message.
In addition, the application code can operate on the [HttpRequestContext](https://github.com/do-/node-http-server-tools) instance `this.http`, specifically:

* `this.http.request`: the original [ClientRequest](https://nodejs.org/api/http.html#class-httpclientrequest);
* `this.http.url`: the reconstructed [URL](https://nodejs.org/api/url.html);
* `this.http.path`: the URL's pathname, split by '/' cleaned up, with `pathBase` elements omitted;
* `this.http.body`: the whole body as a [Buffer](https://nodejs.org/docs/latest/api/buffer.html#buffer);
* `this.http.bodyText`: the same, as a string.

### `request`
The content of this object, which is empty by default, is copied into every `this.request`, with the lowest priority.

### `getRequest`
This function with the [HttpRequestContext](https://github.com/do-/node-http-server-tools/wiki#reading-incoming-data) argument merges parameters read from three different HTTP request parts into one object.

You can use it, for example, to restrict the source of the input.
```js
getRequest: http => http.bodyParams, // the URL will be ignored
```

Instead of setting this option, you can rewrite the method of the same name, which can be useful for adding new parameter sources:
```js
class extends WebService {
  getRequest (http) {
    return {
      ...super.getRequest (http),
      _secret: http.request.header ['x-my-secret'],
    }
  }
}
```
### `parse`
This function, which defaults to [`JSON.parse()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) is used to convert the HTTP request body, which is read completely as a string, into the `.bodyParams' object. 

For SOAP services, an XML parser must be used here.

In some cases, the developer may choose to set it to an empty function and operate directly on `this.http.bodyText` or `this.http.body`.

### `keepBody`
Normally, for `POST` / `PUT` / `PATCH` requests, `WebService` tries to read the whole body before continuing with `getRequest`, to make `bodyParams` available.

In some cases, however, the business method needs to read it progressively, as a [Readable stream](https://nodejs.org/docs/latest/api/stream.html#readable-streams). To make this possible, the `WebService` must be configured with `keepBody` returning `true` in such cases. Then, even for for `POST` / `PUT` / `PATCH` `this.http.bodyText` will be `''` and `this.http.bodyParams` — `{}`.

### `maxBodySize`
If the request has the body and reading it is not prevented, its length, in bytes, must not exceed `maxBodySize`, which is 10 Mb by default. Otherwise, [413 Content Too Large](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/413) will be thrown.

### `pathBase`
If the WebService is co-located with several others and only receives requests whose URLs start with a fixed prefix, you may want to exclude it from the application's visibility. Consider a URL like `http://127.0.0.1/api/v.1.0.1/users/1`: the `api/v.1.0.1` part here is likely to be subject to any environment configuration while `users/1` carries the business data.

By setting `pathBase` to `2` in this case, we restrict `path` to `['users', '1']`. Also, the API version will not pollute the `pathParams` (if any, see right below).

### `pathMapping`
Unlike many well-known RESTful frameworks, `doix-http` doesn't map URLs to individual methods using global [NamingConventions](https://github.com/do-/node-doix/wiki/NamingConventions) instead. However, it's possible to use a common REST-like pattern, e.g. by, reading the `type` parameter from the root part of the [URL pathname](https://developer.mozilla.org/en-US/docs/Web/API/URL/pathname) and 'id' from the next one (if any). To do this, you should configure 
```js
pathMapping: ([type, id]) => ({type, id})
```
as shown above. This will be used to construct `this.http.pathParams`. By default, `pathParams` is always here and even merged into `this.request`, but, without `pathMapping` defined, it's an empty object `{}`.

## Writing Response
Normally, the business method called by `WebService` should return a plain Object. It's subject to `stringify` and output with `statusCode`, `contentType` and `charset`.

If a string is returned, `stringify` is skipped, but `contentType` and `charset` are applied.

For special objects representing binary content: [Buffers](https://nodejs.org/docs/latest/api/buffer.html#buffer) and [Readable streams](https://nodejs.org/docs/latest/api/stream.html#readable-streams), moreover, global `contentType` and `charset` are ignored, and streams are [piped](https://nodejs.org/docs/latest/api/stream.html#readablepipedestination-options) directly into the `this.http.response`.

Finally, an empty [204 No Content](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204) response is generated for an `undefined` result.

Returning any other type of result (functions, symbols etc.) will result in an error.

Speaking of errors: they can be explicitly thrown from within a business method instead of returning any result. Or they can be generated by different parts of the framework or external libraries. Either way, for each special [http error](https://www.npmjs.com/package/http-errors), its meta information is used to construct the HTTP response: the `statusCode` overrides any previously set; in case of falsy `expose` the `message` is replaced by the fixed status text. Any generic `Error` is wrapped up with the configured `createError`. Finally, if the method throws a value of a random type, it's first converted into `Job.NotAnError` and then handled as described above.

Note that, to generate the HTTP response, application developers are free to use (at their own risk, of course) [`this.http.write*`](https://github.com/do-/node-http-server-tools/wiki#writing-results) methods or, eventually, the raw [`this.http.response`](https://nodejs.org/docs/latest/api/http.html#class-httpserverresponse).

Further down in this section, the options that affect the response are described in detail.
### Normal Results (Not Errors)
#### `statusCode`
The default [response.statusCode](https://nodejs.org/docs/latest/api/http.html#responsestatuscode). To set a non standard value in a specific business method, `this.http.statusCode` is available:
```js
this.http.statusCode = 201
// TIMTOWTDI
// this.http.response.statusCode = 201
```
In case of error, it is overridden anyway.
#### Serializable Results
The options listed here apply to results that are neither [Buffers](https://nodejs.org/docs/latest/api/buffer.html#buffer) nor [Readable streams](https://nodejs.org/docs/latest/api/stream.html#readable-streams)

##### `stringify`
This function, which defaults to [`JSON.stringify()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify), this function is used to convert the value returned by the method (or, more precisely, `this.result` set by `doix`) into the string to be written as the HTTP response body.

##### `contentType`
The [Content-Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type) header value, unless explicitly set:

```js
this.http.contentType = 'text/cryptic'
// or even
// this.http.response.setHeader ('content-type', 'application/warm')
```

##### `charset`
The `charset` option appended to the [Content-Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type) header (including the default  `application/octet-stream`) and used to encode the `stringify` result. Better left `'utf-8'`.

### Errors
#### `createError`
This function must translate a generic [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) object into an [http error](https://www.npmjs.com/package/http-errors). By default, wraps it into [500 Internal Server Error](https://developer.mozilla.org/ru/docs/Web/HTTP/Status/500). 

In certain applications, it may detect specific meta-information and set special status codes such as [422 Unprocessable Content](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422) for validation errors.

## Workflow Extension Points
### `on` 
This [JobSource](https://github.com/do-/node-doix/wiki/JobSource) option is a bag of lists of additional handlers that the WebService assigns for  [events](https://github.com/do-/node-doix/wiki/Job#events) occurring during the [Job](https://github.com/do-/node-doix/wiki/Job) lifecycle. Specifically:

| Event | New properties available | Possible use | 
| - | - | - |
| `'init'` | `this.http` | Custom parsing / validation |
| `'start'` | `this.method`, `this.user` | Security checks |
| `'end'` | `this.result` | Result rewriting |
| `'error'` | `this.error` | Error rewriting |

In particular, the `'end'` handler can modify `this.result` by adding some meta information: in this case, the corrected value will be subject to `stringify` instead of the original business method result.

Unlike the standard [Events](https://nodejs.org/docs/latest/api/events.html#events), handlers can be asynchronous here. For example, the [doix-http-cookie-redis](https://github.com/do-/node-doix-http-cookie-redis) addon asynchronously fetches session data from an external resource at `'init'` and stores it back at `'end'`.

Multiple asynchronous handlers for an event are executed with [Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all), they cannot depend on each other. For example, adding a second `'end'` handler that rewrites `this.result` will make the result unpredictable.

To ensure the order of execution for `'init'`, `'end'` and `'error'` events, you can rewrite the corresponding [methods](https://github.com/do-/node-doix-http/wiki/WebService#onjobinit-job) instead of configuring handlers.

## Routing
Options in this section work only with [`HttpRouter`](https://github.com/do-/node-protocol-agnostic-router/wiki/HttpRouter).
### `location` 
Like [Apache httpd's `Location`](https://httpd.apache.org/docs/2.4/mod/core.html#location), 
[nginx' `location`](https://nginx.org/en/docs/http/ngx_http_core_module.html#location) and similar directives. 

This can be a string or a regular expression. For a `location` given as a string, the `pathBase` is set automatically. Otherwise, the developer should set it explicitly.

### `test` 
This function, if set, receives each [request](https://nodejs.org/docs/latest/api/http.html#class-httpclientrequest) incoming to the router and must return a Boolean value indicating whether the WebService accepts the message for processing. This is a more flexible alternative to `location`.

## Bandwidth Control
### `maxLatency`
This option can (and should) be set to a finite positive number indicating the maximum time to wait for the business method to return a response, in milliseconds. If the time expires without a result being returned, an error is thrown.

For web UI backend services in particular, it's a good idea to set `maxLatency: 10000`. Staring at a web form that is stuck for 10 seconds will make any user think the server is dead anyway.

### `maxPending`
This is the maximum number of requests to handle simultaneously. With `maxPending` requests in process, an attempt to take another will result in a `JobSource.OverflowError'.

At any time:
* `ws.pending` is the [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) of all [Jobs](https://github.com/do-/node-doix/wiki/Job) in progress;
* `ws.capacity` is the number of requests that can be accepted immediately (`Infinity` if `maxPending` is not set).

## Context Injection
Every option in this section has a counterpart in [Application](https://github.com/do-/node-doix/wiki/Application). The application's defaults are inherited, only specific variables need to be set for each service.

### `globals`
Entries of this object will be copied into `this` [Job](https://github.com/do-/node-doix/wiki/Job) instance upon its creation. For example,
```js
//
globals: {xsd: mySchema},
//
getList: async function () {
  return this.xsd.serialize ([])
}
```
makes `this.wsdl` available when executing each business method. 

### `generators`
Similar to `globals`, this option contains no-arguments functions called to generate values for eponymous properties of `this`. Typically, they are used for one-off random values:
```js
//...
generators: {noCache: () => Math.random ()},
//...
getList: async function () {
  return [this.noCache]
}
```

### `pools`
Here, [ResourcePool](https://github.com/do-/node-doix/wiki/ResourcePool)s are provided, first of all, [database connections](https://github.com/do-/node-doix-db/wiki/DbPool).
```js
//...
pools: {db: myDbPool},
//...
getList: async function () {
  return db.getArray ('SELECT * FROM my_table')
}
```
## Miscellaneous
### `logger`
The [winston](https://github.com/winstonjs/winston) logger used to automatically [track](https://github.com/do-/node-events-to-winston) the WebService lifecycle. Defaults to one used by the hosting [Application](https://github.com/do-/node-doix/wiki/Application).

# See also
This library provides [`CookieSession`](https://github.com/do-/node-doix-http/wiki/CookieSession): a companion class to `WebService`, the base for implementing [cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) related session workflows, such as [`doix-http-cookie-redis`](https://github.com/do-/node-doix-http-cookie-redis) and [`doix-http-cookie-jwt`](https://github.com/do-/node-doix-http-cookie-jwt).

Most of the `WebService`'s functionality is implemented via the [`HttpRequestContext`](https://github.com/do-/node-http-server-tools/wiki) class, which can be used alone.

Very few Web services can be developed without interaction with database servers. The [`doix-db`](https://github.com/do-/node-doix-db/wiki) module offers an API that can be quite helpful when dealing with relational databases.

To delve deeper into the topic of `doix` applications, modules, jobs, resources etc., consider using the [core framework](https://github.com/do-/node-doix/wiki) documentation.
