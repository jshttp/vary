
var vary = require('..');
var should = require('should');

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
      it('should be required', function () {
        var res = createRes();
        vary.bind(null, res).should.throw(/field.*required/);
      });

      it('should accept string', function () {
        var res = createRes();
        vary.bind(null, res, 'foo').should.not.throw();
      });

      it('should accept array of string', function () {
        var res = createRes();
        vary.bind(null, res, ['foo', 'bar']).should.not.throw();
      });

      it('should not allow separators', function () {
        var res = createRes();
        vary.bind(null, res, 'invalid:header').should.throw(/field.*contains.*invalid/);
        vary.bind(null, res, 'invalid header').should.throw(/field.*contains.*invalid/);
        vary.bind(null, res, ['invalid header']).should.throw(/field.*contains.*invalid/);
      });
    });
  });

  describe('when no Vary', function () {
    it('should set value', function () {
      var res = createRes();
      vary(res, 'Origin');
      res.getHeader('Vary').should.equal('Origin');
    });

    it('should set value with multiple calls', function () {
      var res = createRes();
      vary(res, 'Origin');
      vary(res, 'User-Agent');
      res.getHeader('Vary').should.equal('Origin, User-Agent');
    });

    it('should preserve case', function () {
      var res = createRes();
      vary(res, 'ORIGIN');
      vary(res, 'user-agent');
      vary(res, 'AccepT');
      res.getHeader('Vary').should.equal('ORIGIN, user-agent, AccepT');
    });
  });

  describe('when existing Vary', function () {
    it('should set value', function () {
      var res = createRes({'vary': 'Accept'});
      vary(res, 'Origin');
      res.getHeader('Vary').should.equal('Accept, Origin');
    });

    it('should set value with multiple calls', function () {
      var res = createRes({'vary': 'Accept'});
      vary(res, 'Origin');
      vary(res, 'User-Agent');
      res.getHeader('Vary').should.equal('Accept, Origin, User-Agent');
    });

    it('should not duplicate existing value', function () {
      var res = createRes({'vary': 'Accept'});
      vary(res, 'Accept');
      res.getHeader('Vary').should.equal('Accept');
    });

    it('should compare case-insensitive', function () {
      var res = createRes({'vary': 'Accept'});
      vary(res, 'accEPT');
      res.getHeader('Vary').should.equal('Accept');
    });

    it('should preserve case', function () {
      var res = createRes({'vary': 'Accept'});
      vary(res, 'AccepT');
      res.getHeader('Vary').should.equal('Accept');
    });
  });

  describe('when existing Vary as array', function () {
    it('should set value', function () {
      var res = createRes({'vary': ['Accept', 'Accept-Encoding']});
      vary(res, 'Origin');
      res.getHeader('Vary').should.equal('Accept, Accept-Encoding, Origin');
    });

    it('should not duplicate existing value', function () {
      var res = createRes({'vary': ['Accept', 'Accept-Encoding']});
      vary(res, 'accept');
      vary(res, 'origin');
      res.getHeader('Vary').should.equal('Accept, Accept-Encoding, origin');
    });
  });

  describe('when Vary: *', function () {
    it('should set value', function () {
      var res = createRes();
      vary(res, '*');
      res.getHeader('Vary').should.equal('*');
    });

    it('should act as if all values alread set', function () {
      var res = createRes({'vary': '*'});
      vary(res, 'Origin');
      vary(res, 'User-Agent');
      res.getHeader('Vary').should.equal('*');
    });

    it('should erradicate existing values', function () {
      var res = createRes({'vary': 'Accept, Accept-Encoding'});
      vary(res, '*');
      res.getHeader('Vary').should.equal('*');
    });

    it('should update bad existing header', function () {
      var res = createRes({'vary': 'Accept, Accept-Encoding, *'});
      vary(res, 'Origin');
      res.getHeader('Vary').should.equal('*');
    });
  });

  describe('when fields is array', function () {
    it('should set value', function () {
      var res = createRes();
      vary(res, ['Accept', 'Accept-Language']);
      res.getHeader('Vary').should.equal('Accept, Accept-Language');
    });

    it('should ignore double-entries', function () {
      var res = createRes();
      vary(res, ['Accept', 'Accept']);
      res.getHeader('Vary').should.equal('Accept');
    });

    it('should be case-insensitive', function () {
      var res = createRes();
      vary(res, ['Accept', 'ACCEPT']);
      res.getHeader('Vary').should.equal('Accept');
    });

    it('should handle contained *', function () {
      var res = createRes();
      vary(res, ['Origin', 'User-Agent', '*', 'Accept']);
      res.getHeader('Vary').should.equal('*');
    });

    it('should handle existing values', function () {
      var res = createRes({'vary': 'Accept, Accept-Encoding'});
      vary(res, ['origin', 'accept', 'accept-charset']);
      res.getHeader('Vary').should.equal('Accept, Accept-Encoding, origin, accept-charset');
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

      it('should accept array of string', function () {
        vary.append.bind(null, '', ['foo', 'bar']).should.not.throw();
      });

      it('should not allow separators', function () {
        vary.append.bind(null, '', 'invalid:header').should.throw(/field.*contains.*invalid/);
        vary.append.bind(null, '', 'invalid header').should.throw(/field.*contains.*invalid/);
        vary.append.bind(null, '', ['invalid header']).should.throw(/field.*contains.*invalid/);
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

  describe('when fields is array', function () {
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

function createRes(headers) {
  var _headers = {};

  for (var key in headers) {
    _headers[key.toLowerCase()] = headers[key];
  }

  return {
    getHeader: function (name) {
      return _headers[name.toLowerCase()];
    },
    setHeader: function (name, val) {
      _headers[name.toLowerCase()] = val;
    }
  };
}
