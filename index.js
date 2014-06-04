/*!
 * vary
 * Copyright(c) 2014 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module exports.
 */

module.exports = vary;

/**
 * Variables.
 */

var separators = /[\(\)<>@,;:\\"\/\[\]\?=\{\}\u0020\u0009]/;

/**
 * Mark that a request is varied on a header.
 *
 * @param {Object} res
 * @param {String} header
 * @api public
 */

function vary(res, header) {
  if (!res || !res.getHeader || !res.setHeader) {
    // quack quack
    throw new TypeError('res argument is required');
  }

  if (!header) {
    throw new TypeError('header argument is required');
  }

  if (separators.test(header)) {
    throw new TypeError('header argument is not a valid header');
  }

  var val = res.getHeader('Vary') || ''
  var headers = Array.isArray(val)
    ? val.join(', ')
    : String(val);

  // existing unspecified vary
  if (headers === '*') {
    return;
  }

  // enumerate current values
  var vals = headers.toLowerCase().split(/ *, */);

  // unspecified vary
  if (header === '*' || vals.indexOf('*') !== -1) {
    res.setHeader('Vary', '*');
    return;
  }

  if (vals.indexOf(header.toLowerCase()) !== -1) {
    // already set
    return;
  }

  // append value (case-preserving)
  val = headers
    ? headers + ', ' + header
    : header;

  res.setHeader('Vary', val);
}
