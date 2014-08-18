# vary

[![NPM Version](http://img.shields.io/npm/v/vary.svg?style=flat)](https://www.npmjs.org/package/vary)
[![NPM Downloads](https://img.shields.io/npm/dm/vary.svg?style=flat)](https://www.npmjs.org/package/vary)
[![Node.js Version](http://img.shields.io/badge/node.js->=_0.8-brightgreen.svg?style=flat)](http://nodejs.org/download/)
[![Build Status](http://img.shields.io/travis/jshttp/vary.svg?style=flat)](https://travis-ci.org/jshttp/vary)
[![Coverage Status](https://img.shields.io/coveralls/jshttp/vary.svg?style=flat)](https://coveralls.io/r/jshttp/vary)

Manipulate the HTTP Vary header

## Installation

```sh
$ npm install vary
```

## API

```js
var vary = require('vary')
```

### vary(res, field)

Adds the given header `field` to the `Vary` response header of `res`.
This can be a string of a single field, a string of a valid `Vary`
header, or an array of multiple fields.

This will append the header if not already listed, otherwise leaves
it listed in the current location.

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

```js
// Get header string appending "Origin" to "Accept, User-Agent"
vary.append('Accept, User-Agent', 'Origin')
```

## Examples

### Updating the Vary header when content is based on it

```js
var http = require('http')
var vary = require('vary')

http.createServer(function onRequest(req, res) {
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
