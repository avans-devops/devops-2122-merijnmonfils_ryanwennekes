const expect = require('chai').expect;
const validateSubmission = require('../business/validate-submission');

describe('Testing validation logic of submission', () => {
  it('Should throw a 400 error when a user tries to post under his own target', async (done) => {
    const target = {
      user: {
        _id: 'user_id'
      }
    };

    const user = {
      user: {
        _id: 'user_id'
      }
    }
    
    try {
      await validateSubmission(target, user, (err) => {done()});
    } catch (err) {
      expect(err.status).to.equal(404);
      expect(err.message).to.equal('You cannot post submissions under your own target!');
      done()
    }
  });

  it('Should throw a 404 error when the target cannot be found', async (done) => {
    const target = null;

    const user = {
      user: {
        _id: 'another_user_id'
      }
    }
    try {
      await validateSubmission(target, user, (err) => { done() });
    } catch (err) {
      expect(err.status).to.equal(404);
      expect(err.message).to.equal('The target was not found!');
      done();
    }
    
  });

  it('Should throw no error when submission is correct', async (done) => {
    const target = {
      user: {
        _id: 'user_id'
      }
    };

    const user = {
      user: {
        _id: 'another_user_id'
      }
    }

    const result = await validateSubmission(target, user, (err) => {
      expect(err).to.equal(null);
      done();
    });
  });
})