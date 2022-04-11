const expect = require('chai').expect;
const validator = require('../models/model').UserRoleValidator;

describe('Testing custom user validation', () => {
  it('Should be invalid when the role is invalid', (done) => {
    const result = validator.validator('some_unknown_role');

    expect(result).to.equal(false);
    done();
  });

  it('Should be valid when the role is "user"', (done) => {
    const result = validator.validator('user');

    expect(result).to.equal(true);
    done();
  });

  it('Should be valid when the role is "admin"', (done) => {
    const result = validator.validator('admin');

    expect(result).to.equal(true);
    done();
  });
});