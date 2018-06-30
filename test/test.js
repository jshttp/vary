
var assert = require('assert')
var http = require('http')
var request = require('supertest')
var vary = require('..')

describe('vary(res, field)', function () {
  describe('arguments', function () {
    describe('res', function () {
      it('should be required', function () {
        assert.throws(vary.bind(), /res.*required/)
      })

      it('should not allow non-res-like objects', function () {
        assert.throws(vary.bind(null, {}), /res.*required/)
      })
    })

    describe('field', function () {
      it('should be required', function (done) {
        request(createServer(callVary()))
          .get('/')
          .expect(500, /field.*required/, done)
      })

      it('should accept string', function (done) {
        request(createServer(callVary('foo')))
          .get('/')
          .expect(200, done)
      })

      it('should accept array of string', function (done) {
        request(createServer(callVary(['foo', 'bar'])))
          .get('/')
          .expect(200, done)
      })

      it('should accept string that is Vary header', function (done) {
        request(createServer(callVary('foo, bar')))
          .get('/')
          .expect(200, done)
      })

      it('should not allow separator ":"', function (done) {
        request(createServer(callVary('invalid:header')))
          .get('/')
          .expect(500, /field.*contains.*invalid/, done)
      })

      it('should not allow separator " "', function (done) {
        request(createServer(callVary('invalid header')))
          .get('/')
          .expect(500, /field.*contains.*invalid/, done)
      })
    })
  })

  describe('when no Vary', function () {
    it('should set value', function (done) {
      request(createServer(callVary('Origin')))
        .get('/')
        .expect('Vary', 'Origin')
        .expect(200, done)
    })

    it('should set value with multiple calls', function (done) {
      request(createServer(callVary(['Origin', 'User-Agent'])))
        .get('/')
        .expect('Vary', 'Origin, User-Agent')
        .expect(200, done)
    })

    it('should preserve case', function (done) {
      request(createServer(callVary(['ORIGIN', 'user-agent', 'AccepT'])))
        .get('/')
        .expect('Vary', 'ORIGIN, user-agent, AccepT')
        .expect(200, done)
    })

    it('should not set Vary on empty array', function (done) {
      request(createServer(callVary([])))
        .get('/')
        .expect(shouldNotHaveHeader('Vary'))
        .expect(200, done)
    })
  })

  describe('when existing Vary', function () {
    it('should set value', function (done) {
      request(createServer(alterVary('Accept', 'Origin')))
        .get('/')
        .expect('Vary', 'Accept, Origin')
        .expect(200, done)
    })

    it('should set value with multiple calls', function (done) {
      var server = createServer(function (req, res) {
        res.setHeader('Vary', 'Accept')
        vary(res, 'Origin')
        vary(res, 'User-Agent')
      })
      request(server)
        .get('/')
        .expect('Vary', 'Accept, Origin, User-Agent')
        .expect(200, done)
    })

    it('should not duplicate existing value', function (done) {
      request(createServer(alterVary('Accept', 'Accept')))
        .get('/')
        .expect('Vary', 'Accept')
        .expect(200, done)
    })

    it('should compare case-insensitive', function (done) {
      request(createServer(alterVary('Accept', 'accEPT')))
        .get('/')
        .expect('Vary', 'Accept')
        .expect(200, done)
    })

    it('should preserve case', function (done) {
      request(createServer(alterVary('AccepT', ['accEPT', 'ORIGIN'])))
        .get('/')
        .expect('Vary', 'AccepT, ORIGIN')
        .expect(200, done)
    })
  })

  describe('when existing Vary as array', function () {
    it('should set value', function (done) {
      request(createServer(alterVary(['Accept', 'Accept-Encoding'], 'Origin')))
        .get('/')
        .expect('Vary', 'Accept, Accept-Encoding, Origin')
        .expect(200, done)
    })

    it('should not duplicate existing value', function (done) {
      request(createServer(alterVary(['Accept', 'Accept-Encoding'], ['accept', 'origin'])))
        .get('/')
        .expect('Vary', 'Accept, Accept-Encoding, origin')
        .expect(200, done)
    })
  })

  describe('when Vary: *', function () {
    it('should set value', function (done) {
      request(createServer(callVary('*')))
        .get('/')
        .expect('Vary', '*')
        .expect(200, done)
    })

    it('should act as if all values alread set', function (done) {
      request(createServer(alterVary('*', ['Origin', 'User-Agent'])))
        .get('/')
        .expect('Vary', '*')
        .expect(200, done)
    })

    it('should erradicate existing values', function (done) {
      request(createServer(alterVary('Accept, Accept-Encoding', '*')))
        .get('/')
        .expect('Vary', '*')
        .expect(200, done)
    })

    it('should update bad existing header', function (done) {
      request(createServer(alterVary('Accept, Accept-Encoding, *', 'Origin')))
        .get('/')
        .expect('Vary', '*')
        .expect(200, done)
    })
  })

  describe('when field is string', function () {
    it('should set value', function (done) {
      request(createServer(callVary('Accept')))
        .get('/')
        .expect('Vary', 'Accept')
        .expect(200, done)
    })

    it('should set value when vary header', function (done) {
      request(createServer(callVary('Accept, Accept-Encoding')))
        .get('/')
        .expect('Vary', 'Accept, Accept-Encoding')
        .expect(200, done)
    })

    it('should acept LWS', function (done) {
      request(createServer(callVary('  Accept     ,     Origin    ')))
        .get('/')
        .expect('Vary', 'Accept, Origin')
        .expect(200, done)
    })

    it('should handle contained *', function (done) {
      request(createServer(callVary('Accept,*')))
        .get('/')
        .expect('Vary', '*')
        .expect(200, done)
    })
  })

  describe('when field is array', function () {
    it('should set value', function (done) {
      request(createServer(callVary(['Accept', 'Accept-Language'])))
        .get('/')
        .expect('Vary', 'Accept, Accept-Language')
        .expect(200, done)
    })

    it('should ignore double-entries', function (done) {
      request(createServer(callVary(['Accept', 'Accept'])))
        .get('/')
        .expect('Vary', 'Accept')
        .expect(200, done)
    })

    it('should be case-insensitive', function (done) {
      request(createServer(callVary(['Accept', 'ACCEPT'])))
        .get('/')
        .expect('Vary', 'Accept')
        .expect(200, done)
    })

    it('should handle contained *', function (done) {
      request(createServer(callVary(['Origin', 'User-Agent', '*', 'Accept'])))
        .get('/')
        .expect('Vary', '*')
        .expect(200, done)
    })

    it('should handle existing values', function (done) {
      request(createServer(alterVary('Accept, Accept-Encoding', ['origin', 'accept', 'accept-charset'])))
        .get('/')
        .expect('Vary', 'Accept, Accept-Encoding, origin, accept-charset')
        .expect(200, done)
    })
  })
})

describe('vary.append(header, field)', function () {
  describe('arguments', function () {
    describe('header', function () {
      it('should be required', function () {
        assert.throws(vary.append.bind(), /header.*required/)
      })

      it('should be a string', function () {
        assert.throws(vary.append.bind(null, 42), /header.*required/)
      })
    })

    describe('field', function () {
      it('should be required', function () {
        assert.throws(vary.append.bind(null, ''), /field.*required/)
      })

      it('should accept string', function () {
        assert.doesNotThrow(vary.append.bind(null, '', 'foo'))
      })

      it('should accept string that is Vary header', function () {
        assert.doesNotThrow(vary.append.bind(null, '', 'foo, bar'))
      })

      it('should accept array of string', function () {
        assert.doesNotThrow(vary.append.bind(null, '', ['foo', 'bar']))
      })

      it('should not allow separator ":"', function () {
        assert.throws(vary.append.bind(null, '', 'invalid:header'), /field.*contains.*invalid/)
      })

      it('should not allow separator " "', function () {
        assert.throws(vary.append.bind(null, '', 'invalid header'), /field.*contains.*invalid/)
      })

      it('should not allow non-token characters', function () {
        assert.throws(vary.append.bind(null, '', 'invalid\nheader'), /field.*contains.*invalid/)
        assert.throws(vary.append.bind(null, '', 'invalid\u0080header'), /field.*contains.*invalid/)
      })
    })
  })

  describe('when header empty', function () {
    it('should set value', function () {
      assert.strictEqual(vary.append('', 'Origin'), 'Origin')
    })

    it('should set value with array', function () {
      assert.strictEqual(vary.append('', ['Origin', 'User-Agent']), 'Origin, User-Agent')
    })

    it('should preserve case', function () {
      assert.strictEqual(vary.append('', ['ORIGIN', 'user-agent', 'AccepT']), 'ORIGIN, user-agent, AccepT')
    })
  })

  describe('when header has values', function () {
    it('should set value', function () {
      assert.strictEqual(vary.append('Accept', 'Origin'), 'Accept, Origin')
    })

    it('should set value with array', function () {
      assert.strictEqual(vary.append('Accept', ['Origin', 'User-Agent']), 'Accept, Origin, User-Agent')
    })

    it('should not duplicate existing value', function () {
      assert.strictEqual(vary.append('Accept', 'Accept'), 'Accept')
    })

    it('should compare case-insensitive', function () {
      assert.strictEqual(vary.append('Accept', 'accEPT'), 'Accept')
    })

    it('should preserve case', function () {
      assert.strictEqual(vary.append('Accept', 'AccepT'), 'Accept')
    })
  })

  describe('when *', function () {
    it('should set value', function () {
      assert.strictEqual(vary.append('', '*'), '*')
    })

    it('should act as if all values already set', function () {
      assert.strictEqual(vary.append('*', 'Origin'), '*')
    })

    it('should erradicate existing values', function () {
      assert.strictEqual(vary.append('Accept, Accept-Encoding', '*'), '*')
    })

    it('should update bad existing header', function () {
      assert.strictEqual(vary.append('Accept, Accept-Encoding, *', 'Origin'), '*')
    })
  })

  describe('when field is string', function () {
    it('should set value', function () {
      assert.strictEqual(vary.append('', 'Accept'), 'Accept')
    })

    it('should set value when vary header', function () {
      assert.strictEqual(vary.append('', 'Accept, Accept-Encoding'), 'Accept, Accept-Encoding')
    })

    it('should acept LWS', function () {
      assert.strictEqual(vary.append('', '  Accept     ,     Origin    '), 'Accept, Origin')
    })

    it('should handle contained *', function () {
      assert.strictEqual(vary.append('', 'Accept,*'), '*')
    })
  })

  describe('when field is array', function () {
    it('should set value', function () {
      assert.strictEqual(vary.append('', ['Accept', 'Accept-Language']), 'Accept, Accept-Language')
    })

    it('should ignore double-entries', function () {
      assert.strictEqual(vary.append('', ['Accept', 'Accept']), 'Accept')
    })

    it('should be case-insensitive', function () {
      assert.strictEqual(vary.append('', ['Accept', 'ACCEPT']), 'Accept')
    })

    it('should handle contained *', function () {
      assert.strictEqual(vary.append('', ['Origin', 'User-Agent', '*', 'Accept']), '*')
    })

    it('should handle existing values', function () {
      assert.strictEqual(vary.append('Accept, Accept-Encoding', ['origin', 'accept', 'accept-charset']), 'Accept, Accept-Encoding, origin, accept-charset')
    })
  })
})

function alterVary (header, field) {
  return function call (req, res) {
    res.setHeader('Vary', header)
    vary(res, field)
  }
}

function callVary (field) {
  return function call (req, res) {
    vary(res, field)
  }
}

function createServer (fn) {
  return http.createServer(function onRequest (req, res) {
    try {
      fn(req, res)
      res.statusCode = 200
    } catch (err) {
      res.statusCode = 500
      res.write(err.message)
    } finally {
      res.end()
    }
  })
}

function shouldNotHaveHeader (header) {
  return function (res) {
    assert.ok(!(header.toLowerCase() in res.headers), 'should not have header ' + header)
  }
}
