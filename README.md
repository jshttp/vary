# vary

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Build Status][ci-image]][ci-url]
[![Coverage Status][coveralls-image]][coveralls-url]

Manipulate the HTTP Vary header

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/). Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally): 

```sh
$ npm install vary
```

## API

<!-- eslint-disable no-unused-vars -->

```js
var vary = require('vary')
```

### vary(res, field)

Adds the given header `field` to the `Vary` response header of `res`.
This can be a string of a single field, a string of a valid `Vary`
header, or an array of multiple fields.

This will append the header if not already listed, otherwise leaves
it listed in the current location.

<!-- eslint-disable no-undef -->

```js
// Append "Origin" to the Vary header of the response
vary(res, 'Origin')
```

### vary.append(header, field)

Adds the given header `field` to the `Vary` response header string `header`.
This can be a string of a single field, a string of a valid `Vary` header,
or an array of multiple fields.

This will append the header if not already listed, otherwise leaves
it listed in the current location. The new header string is returned.

<!-- eslint-disable no-undef -->

```js
// Get header string appending "Origin" to "Accept, User-Agent"
vary.append('Accept, User-Agent', 'Origin')
```

## Examples

### Updating the Vary header when content is based on it

```js
var http = require('http')
var vary = require('vary')

http.createServer(function onRequest (req, res) {
  // about to user-agent sniff
  vary(res, 'User-Agent')

  var ua = req.headers['user-agent'] || ''
  var isMobile = /mobi|android|touch|mini/i.test(ua)

  // serve site, depending on isMobile
  res.setHeader('Content-Type', 'text/html')
  res.end('You are (probably) ' + (isMobile ? '' : 'not ') + 'a mobile user')
})
```

## Testing

```sh
$ npm test
```

## License

[MIT](LICENSE)


[ci-image]: https://badgen.net/github/checks/jshttp/vary/master?label=ci
[ci-url]: https://github.com/jshttp/vary/actions/workflows/ci.yml
[coveralls-image]: https://badgen.net/coveralls/c/github/jshttp/vary/master
[coveralls-url]: https://coveralls.io/r/jshttp/vary?branch=master
[node-version-image]: https://badgen.net/npm/node/vary
[node-version-url]: https://nodejs.org/en/download
[npm-downloads-image]: https://badgen.net/npm/dm/vary
[npm-url]: https://npmjs.org/package/vary
[npm-version-image]: https://badgen.net/npm/v/vary
