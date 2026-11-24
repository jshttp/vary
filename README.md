# vary

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Build Status][ci-image]][ci-url]
[![Coverage Status][codecov-image]][codecov-url]

Manipulate the HTTP `Vary` header.

## Installation

```sh
npm install vary
```

## API

```js
import { vary, append, format, parse } from "vary";
```

### vary(res, field)

Adds the given header `field` to the `Vary` response header of `res`. This can be a string of a single field, a string of a valid `Vary` header, or an array of multiple fields.

This will append the header if not already listed, otherwise leaves it listed in the current location.

```js
// Append "Origin" to the Vary header of the response
vary(res, "Origin");
```

### append(header, field)

Returns the updated `Vary` header string after adding `field` to `header`. Pass a single field name, a comma-separated string of field names, or an array of field names.

Field names are compared case-insensitively. Each new name is appended and existing names stay in place. If either argument contains a wildcard `*`, the result is `"*"`. Invalid field names in `field` throw a `TypeError`.

```js
// Get header string appending "Origin" to "Accept, User-Agent"
append("Accept, User-Agent", "Origin");
```

### parse(header)

Splits a `Vary` header into an array of strings.

```js
parse("Accept-Encoding, Origin"); // ["Accept-Encoding", "Origin"]
```

### format(fields)

Validates and joins field names with `, `, preserving all fields as-is. Invalid field names throw a `TypeError`.

```js
format(["Accept-Encoding", "Origin", "origin"]); // "Accept-Encoding, Origin, origin"
```

## Examples

### Updating the Vary header when content is based on it

```js
// In a request handler that serves content based on the User-Agent header
vary(res, "User-Agent");
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
