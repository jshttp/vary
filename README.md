# vary

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Build Status][ci-image]][ci-url]
[![Coverage Status][codecov-image]][codecov-url]

Manipulate the HTTP Vary header

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/). Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally).

```sh
npm install vary
```

Requires Node.js 22 or later.

## API

```js
import { append, vary } from "vary";
```

The default import is also callable and exposes `vary.append`.

### vary(res, field)

Adds the given header `field` to the `Vary` response header of `res`.
This can be a string of a single field, a string of a valid `Vary`
header, or an array of multiple fields.

This will append the header if not already listed, otherwise leaves
it listed in the current location.

```js
// Append "Origin" to the Vary header of the response
vary(res, "Origin");
```

### append(header, field)

Adds the given header `field` to the `Vary` response header string `header`.
This can be a string of a single field, a string of a valid `Vary` header,
or an array of multiple fields.

This will append the header if not already listed, otherwise leaves
it listed in the current location. The new header string is returned.

```js
// Get header string appending "Origin" to "Accept, User-Agent"
append("Accept, User-Agent", "Origin");
```

## Examples

### Updating the Vary header when content is based on it

```js
import { createServer } from "node:http";
import { vary } from "vary";

createServer(function onRequest(req, res) {
  // about to user-agent sniff
  vary(res, "User-Agent");

  const ua = req.headers["user-agent"] || "";
  const isMobile = /mobi|android|touch|mini/i.test(ua);

  // serve site, depending on isMobile
  res.setHeader("Content-Type", "text/html");
  res.end("You are (probably) " + (isMobile ? "" : "not ") + "a mobile user");
});
```

## License

[MIT](LICENSE)

[ci-image]: https://img.shields.io/github/actions/workflow/status/jshttp/vary/ci.yml?branch=master&label=ci
[ci-url]: https://github.com/jshttp/vary/actions/workflows/ci.yml
[codecov-image]: https://img.shields.io/codecov/c/github/jshttp/vary/master
[codecov-url]: https://codecov.io/gh/jshttp/vary
[node-version-image]: https://img.shields.io/node/v/vary
[node-version-url]: https://nodejs.org/en/download
[npm-downloads-image]: https://img.shields.io/npm/dm/vary
[npm-url]: https://npmjs.org/package/vary
[npm-version-image]: https://img.shields.io/npm/v/vary
