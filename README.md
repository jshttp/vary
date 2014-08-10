# vary

[![NPM Version](http://img.shields.io/npm/v/vary.svg)](https://www.npmjs.org/package/vary)
[![Node.js Version](http://img.shields.io/badge/node.js->=_0.8-blue.svg)](http://nodejs.org/download/)
[![Build Status](http://img.shields.io/travis/expressjs/vary.svg)](https://travis-ci.org/expressjs/vary)
[![Coverage Status](https://img.shields.io/coveralls/expressjs/vary.svg)](https://coveralls.io/r/expressjs/vary)
[![Gittip](http://img.shields.io/gittip/dougwilson.svg)](https://www.gittip.com/dougwilson/)

Update the Vary header of a response

## Install

```sh
$ npm install vary
```

## API

```js
var vary = require('vary')
```

### vary(res, field)

Adds the given header `field` to the `Vary` response header of `res`.
This can be a string of a single field or an array of multiple fields.

This will append the header if not already listed, otherwise leaves
it listed in the current location.

```js
vary(res, 'Origin')
vary(res, 'User-Agent')
vary(res, ['Accept', 'Accept-Language', 'Accept-Encoding'])
```

## Testing

```sh
$ npm test
```

## License

[MIT](LICENSE)
