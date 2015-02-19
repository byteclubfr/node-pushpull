"use strict"

import Push from "../src/push";
import expect from "expect";

describe("Push", () => {

  var queue = "_test_push_pull_queue_";
  var push;

  var cleanup = (done) => push._redisClient ? push._redisClient.del(queue, done) : done();

  before(() => push = new Push({"queue": queue}));
  before(cleanup);
  after(cleanup);
  after(() => push.end());

  it("should expose Redis client", () => {
    expect(push._redisClient).toExist();
  });

  it("should emit 'pushed' when pushing data", (done) => {
    var data = {"some": "data"};
    push.write(data);
    push.once("error", done);
    push.once("pushed", (pushed) => {
      expect(pushed).toEqual(data);
      done();
    });
  });

  it("should call callback when pushing data", (done) => {
    push.write({"other": "data"}, done);
  });

  it("should have added items to Redis list", (done) => {
    push._redisClient.llen(queue, (err, len) => {
      expect(err).toNotExist();
      expect(len).toEqual(2);
      done();
    });
  });

});
