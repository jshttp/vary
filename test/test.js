
var http = require('http');
var request = require('supertest');
var should = require('should');
var vary = require('..');

describe('vary(res, field)', function () {
  describe('arguments', function () {
    describe('res', function () {
      it('should be required', function () {
        vary.bind().should.throw(/res.*required/);
      });

      it('should not allow non-res-like objects', function () {
        vary.bind(null, {}).should.throw(/res.*required/);
      });
    });

    describe('field', function () {
      it('should be required', function (done) {
        request(createServer(callVary()))
        .get('/')
        .expect(500, /field.*required/, done);
      });

      it('should accept string', function (done) {
        request(createServer(callVary('foo')))
        .get('/')
        .expect(200, done);
      });

      it('should accept array of string', function (done) {
        request(createServer(callVary(['foo', 'bar'])))
        .get('/')
        .expect(200, done);
      });

      it('should accept string that is Vary header', function (done) {
        request(createServer(callVary('foo, bar')))
        .get('/')
        .expect(200, done);
      });

      it('should not allow separator ":"', function (done) {
        request(createServer(callVary('invalid:header')))
        .get('/')
        .expect(500, /field.*contains.*invalid/, done);
      });

      it('should not allow separator " "', function (done) {
        request(createServer(callVary('invalid header')))
        .get('/')
        .expect(500, /field.*contains.*invalid/, done);
      });
    });
  });

  describe('when no Vary', function () {
    it('should set value', function (done) {
      request(createServer(callVary('Origin')))
      .get('/')
      .expect('Vary', 'Origin')
      .expect(200, done);
    });

    it('should set value with multiple calls', function (done) {
      request(createServer(callVary(['Origin', 'User-Agent'])))
      .get('/')
      .expect('Vary', 'Origin, User-Agent')
      .expect(200, done);
    });

    it('should preserve case', function (done) {
      request(createServer(callVary(['ORIGIN', 'user-agent', 'AccepT'])))
      .get('/')
      .expect('Vary', 'ORIGIN, user-agent, AccepT')
      .expect(200, done);
    });
  });

  describe('when existing Vary', function () {
    it('should set value', function (done) {
      request(createServer(alterVary('Accept', 'Origin')))
      .get('/')
      .expect('Vary', 'Accept, Origin')
      .expect(200, done);
    });

    it('should set value with multiple calls', function (done) {
      var server = createServer(function (req, res) {
       res.setHeader('Vary', 'Accept');
       vary(res, 'Origin');
       vary(res, 'User-Agent');
      });
      request(server)
      .get('/')
      .expect('Vary', 'Accept, Origin, User-Agent')
      .expect(200, done);
    });

    it('should not duplicate existing value', function (done) {
      request(createServer(alterVary('Accept', 'Accept')))
      .get('/')
      .expect('Vary', 'Accept')
      .expect(200, done);
    });

    it('should compare case-insensitive', function (done) {
      request(createServer(alterVary('Accept', 'accEPT')))
      .get('/')
      .expect('Vary', 'Accept')
      .expect(200, done);
    });

    it('should preserve case', function (done) {
      request(createServer(alterVary('AccepT', ['accEPT', 'ORIGIN'])))
      .get('/')
      .expect('Vary', 'AccepT, ORIGIN')
      .expect(200, done);
    });
  });

  describe('when existing Vary as array', function () {
    it('should set value', function (done) {
      request(createServer(alterVary(['Accept', 'Accept-Encoding'], 'Origin')))
      .get('/')
      .expect('Vary', 'Accept, Accept-Encoding, Origin')
      .expect(200, done);
    });

    it('should not duplicate existing value', function (done) {
      request(createServer(alterVary(['Accept', 'Accept-Encoding'], ['accept', 'origin'])))
      .get('/')
      .expect('Vary', 'Accept, Accept-Encoding, origin')
      .expect(200, done);
    });
  });

  describe('when Vary: *', function () {
    it('should set value', function (done) {
      request(createServer(callVary('*')))
      .get('/')
      .expect('Vary', '*')
      .expect(200, done);
    });

    it('should act as if all values alread set', function (done) {
      request(createServer(alterVary('*', ['Origin', 'User-Agent'])))
      .get('/')
      .expect('Vary', '*')
      .expect(200, done);
    });

    it('should erradicate existing values', function (done) {
      request(createServer(alterVary('Accept, Accept-Encoding', '*')))
      .get('/')
      .expect('Vary', '*')
      .expect(200, done);
    });

    it('should update bad existing header', function (done) {
      request(createServer(alterVary('Accept, Accept-Encoding, *', 'Origin')))
      .get('/')
      .expect('Vary', '*')
      .expect(200, done);
    });
  });

  describe('when field is string', function () {
    it('should set value', function (done) {
      request(createServer(callVary('Accept')))
      .get('/')
      .expect('Vary', 'Accept')
      .expect(200, done);
    });

    it('should set value when vary header', function (done) {
      request(createServer(callVary('Accept, Accept-Encoding')))
      .get('/')
      .expect('Vary', 'Accept, Accept-Encoding')
      .expect(200, done);
    });

    it('should acept LWS', function (done) {
      request(createServer(callVary('  Accept     ,     Origin    ')))
      .get('/')
      .expect('Vary', 'Accept, Origin')
      .expect(200, done);
    });

    it('should handle contained *', function (done) {
      request(createServer(callVary('Accept,*')))
      .get('/')
      .expect('Vary', '*')
      .expect(200, done);
    });
  });

  describe('when field is array', function () {
    it('should set value', function (done) {
      request(createServer(callVary(['Accept', 'Accept-Language'])))
      .get('/')
      .expect('Vary', 'Accept, Accept-Language')
      .expect(200, done);
    });

    it('should ignore double-entries', function (done) {
      request(createServer(callVary(['Accept', 'Accept'])))
      .get('/')
      .expect('Vary', 'Accept')
      .expect(200, done);
    });

    it('should be case-insensitive', function (done) {
      request(createServer(callVary(['Accept', 'ACCEPT'])))
      .get('/')
      .expect('Vary', 'Accept')
      .expect(200, done);
    });

    it('should handle contained *', function (done) {
      request(createServer(callVary(['Origin', 'User-Agent', '*', 'Accept'])))
      .get('/')
      .expect('Vary', '*')
      .expect(200, done);
    });

    it('should handle existing values', function (done) {
      request(createServer(alterVary('Accept, Accept-Encoding', ['origin', 'accept', 'accept-charset'])))
      .get('/')
      .expect('Vary', 'Accept, Accept-Encoding, origin, accept-charset')
      .expect(200, done);
    });
  });
});

describe('vary.append(header, field)', function () {
  describe('arguments', function () {
    describe('header', function () {
      it('should be required', function () {
        vary.append.bind().should.throw(/header.*required/);
      });

      it('should be a string', function () {
        vary.append.bind(null, 42).should.throw(/header.*required/);
      });
    });

    describe('field', function () {
      it('should be required', function () {
        vary.append.bind(null, '').should.throw(/field.*required/);
      });

      it('should accept string', function () {
        vary.append.bind(null, '', 'foo').should.not.throw();
      });

      it('should accept string that is Vary header', function () {
        vary.append.bind(null, '', 'foo, bar').should.not.throw();
      });

      it('should accept array of string', function () {
        vary.append.bind(null, '', ['foo', 'bar']).should.not.throw();
      });

      it('should not allow separator ":"', function () {
        vary.append.bind(null, '', 'invalid:header').should.throw(/field.*contains.*invalid/);
      });

      it('should not allow separator " "', function () {
        vary.append.bind(null, '', 'invalid header').should.throw(/field.*contains.*invalid/);
      });
    });
  });

  describe('when header empty', function () {
    it('should set value', function () {
      vary.append('', 'Origin').should.equal('Origin');
    });

    it('should set value with array', function () {
      vary.append('', ['Origin', 'User-Agent']).should.equal('Origin, User-Agent');
    });

    it('should preserve case', function () {
      vary.append('', ['ORIGIN', 'user-agent', 'AccepT']).should.equal('ORIGIN, user-agent, AccepT');
    });
  });

  describe('when header has values', function () {
    it('should set value', function () {
      vary.append('Accept', 'Origin').should.equal('Accept, Origin');
    });

    it('should set value with array', function () {
      vary.append('Accept', ['Origin', 'User-Agent']).should.equal('Accept, Origin, User-Agent');
    });

    it('should not duplicate existing value', function () {
      vary.append('Accept', 'Accept').should.equal('Accept');
    });

    it('should compare case-insensitive', function () {
      vary.append('Accept', 'accEPT').should.equal('Accept');
    });

    it('should preserve case', function () {
      vary.append('Accept', 'AccepT').should.equal('Accept');
    });
  });

  describe('when *', function () {
    it('should set value', function () {
      vary.append('', '*').should.equal('*');
    });

    it('should act as if all values already set', function () {
      vary.append('*', 'Origin').should.equal('*');
    });

    it('should erradicate existing values', function () {
      vary.append('Accept, Accept-Encoding', '*').should.equal('*');
    });

    it('should update bad existing header', function () {
      vary.append('Accept, Accept-Encoding, *', 'Origin').should.equal('*');
    });
  });

  describe('when field is string', function () {
    it('should set value', function () {
      vary.append('', 'Accept').should.equal('Accept');
    });

    it('should set value when vary header', function () {
      vary.append('', 'Accept, Accept-Encoding').should.equal('Accept, Accept-Encoding');
    });

    it('should acept LWS', function () {
      vary.append('', '  Accept     ,     Origin    ').should.equal('Accept, Origin');
    });

    it('should handle contained *', function () {
      vary.append('', 'Accept,*').should.equal('*');
    });
  });

  describe('when field is array', function () {
    it('should set value', function () {
      vary.append('', ['Accept', 'Accept-Language']).should.equal('Accept, Accept-Language');
    });

    it('should ignore double-entries', function () {
      vary.append('', ['Accept', 'Accept']).should.equal('Accept');
    });

    it('should be case-insensitive', function () {
      vary.append('', ['Accept', 'ACCEPT']).should.equal('Accept');
    });

    it('should handle contained *', function () {
      vary.append('', ['Origin', 'User-Agent', '*', 'Accept']).should.equal('*');
    });

    it('should handle existing values', function () {
      vary.append('Accept, Accept-Encoding', ['origin', 'accept', 'accept-charset']).should.equal('Accept, Accept-Encoding, origin, accept-charset');
    });
  });
});

function alterVary(header, field) {
  return function call(req, res) {
    res.setHeader('Vary', header);
    vary(res, field);
  };
}

function callVary(field) {
  return function call(req, res) {
    vary(res, field);
  };
}

function createServer(fn) {
  return http.createServer(function onRequest(req, res) {
    try {
      fn(req, res);
      res.statusCode = 200;
    } catch (err) {
      res.statusCode = 500;
      res.write(err.message);
    } finally {
      res.end();
    }
  });
}
