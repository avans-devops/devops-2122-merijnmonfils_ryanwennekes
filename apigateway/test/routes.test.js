const request = require('supertest');
const expect = require('chai').expect;

const app = require('express')();
const submissionRoutes = require('../routes/submissions');
const targetRoutes = require('../routes/targets');

app.use('/submissions', submissionRoutes);
app.use('/targets', targetRoutes);

function makeRequest(route, statusCode, done) {
  request(app)
    .get(route)
    .expect(statusCode)
    .end((err, res) => {
      if (err) { return done (err); }

      done(null, res);
    });
}

describe('Testing all request forwarding patterns', () => {
  describe('Testing submission routes', () => {
    it('should forward / to user service', (done) => {
      makeRequest('/submissions', 200, (err, res) => {
        if (err) { return done (err); }
        done();
      });
    })
  })
})