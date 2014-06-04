
var vary = require('..');
var should = require('should');

describe('vary(res, header)', function () {
  describe('arguments', function () {
    describe('res', function () {
      it('should be required', function () {
        vary.bind().should.throw(/res.*required/);
      });

      it('should not allow non-res-like objects', function () {
        vary.bind(null, {}).should.throw(/res.*required/);
      });
    });

    describe('header', function () {
      it('should be required', function () {
        var res = createRes();
        vary.bind(null, res).should.throw(/header.*required/);
      });

      it('should not allow separators', function () {
        var res = createRes();
        vary.bind(null, res, 'invalid:header').should.throw(/header.*not.*valid/);
        vary.bind(null, res, 'invalid header').should.throw(/header.*not.*valid/);
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
