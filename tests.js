/* globals describe, beforeEach, afterEach, it, expect */
'use strict';

require('repo-standards').exposeTestGlobals();
const easyFix = require('./index');

const thingToTest = {
  state: 0,
  incStateNextTick: (stateArg, callback) => {
    thingToTest.state = stateArg.val;
    process.nextTick(() => {
      thingToTest.state += 1;
      callback(null, thingToTest.state);
    });
  },
  incStateAfterThreeSeconds: (stateArg, callback) => {
    thingToTest.state = stateArg.val;
    setTimeout(() => {
      thingToTest.state += 1;
      callback(null, thingToTest.state);
    }, 3000);
  },
  resetState: () => {
    thingToTest.state = 0;
  }
};

let stub;
const runSharedTests = (expectTargetFnCalls) => {
  it('returns a sinon stub', function () {
    expect(stub.callCount).to.be.a('number');
    expect(stub.withArgs).to.be.a('function');
  });

  it('falls back onto wrapped method', function (done) {
    thingToTest.incStateNextTick({ val: 0 }, (err, state) => {
      expect(state).to.equal(1);
      const expectedTargetState = expectTargetFnCalls ? 1 : 0;
      expect(thingToTest.state).to.equal(expectedTargetState);
      expect(stub.callCount).to.equal(1);
      done();
    });
  });

  it('works with mulitple calls', function (done) {
    thingToTest.incStateNextTick({ val: 0 }, (firstErr, firstState) => {
      thingToTest.incStateNextTick({ val: firstState }, (secondErr, secondState) => {
        expect(secondState).to.equal(2);
        const expectedTargetState = expectTargetFnCalls ? 2 : 0;
        expect(thingToTest.state).to.equal(expectedTargetState);
        expect(stub.callCount).to.equal(2);
        done();
      });
    });
  });

  it('works with circular references', function (done) {
    const testObj = { val: 0 };
    testObj.circ = testObj;
    thingToTest.incStateNextTick(testObj, (err, state) => {
      expect(state).to.equal(1);
      const expectedTargetState = expectTargetFnCalls ? 1 : 0;
      expect(thingToTest.state).to.equal(expectedTargetState);
      expect(stub.callCount).to.equal(1);
      done();
    });
  });
};

describe('wrapAsyncMethod (live mode)', function () {
  beforeEach(() => {
    thingToTest.resetState();
    stub = easyFix.wrapAsyncMethod(thingToTest, 'incStateNextTick', {
      mode: 'live',
      dir: 'tmp'
    });
  });
  afterEach(() => {
    stub.restore();
  });

  runSharedTests(true);
});

describe('wrapAsyncMethod (capture mode)', function () {
  beforeEach(() => {
    thingToTest.resetState();
    stub = easyFix.wrapAsyncMethod(thingToTest, 'incStateNextTick', {
      mode: 'capture',
      dir: 'tmp'
    });
  });
  afterEach(() => {
    stub.restore();
  });

  runSharedTests(true);
});

describe('wrapAsyncMethod (replay mode)', function () {
  beforeEach(() => {
    thingToTest.resetState();
    stub = easyFix.wrapAsyncMethod(thingToTest, 'incStateNextTick', {
      mode: 'replay',
      dir: 'tmp'
    });
  });
  afterEach(() => {
    stub.restore();
  });

  runSharedTests(false);
});
