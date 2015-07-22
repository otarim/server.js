var server = require('../server'),
	http = require('http'),
	assert = require('assert')
describe('test connet', function() {
	it('should return 200 statusCode', function(done) {
		http.get('http://127.0.0.1:2333', function(res) {
			assert.equal(res.statusCode, 200)
			done()
		})
	})
})