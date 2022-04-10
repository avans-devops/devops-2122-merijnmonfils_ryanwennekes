const expect = require('chai').expect;
const similarityCalculator = require('../business/similarity-calculator');

describe('Testing image similarity calculator', () => {
  it('Should not be higher than 100 percent', (done) => {
    const result = similarityCalculator(0);

    expect(result).to.equal(100);
    done();
  });

  it('Should not be lower than 0 percent', (done) => {
    const result = similarityCalculator(Infinity);

    expect(result).to.equal(0);
    done();
  });
})