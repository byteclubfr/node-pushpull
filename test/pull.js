"use strict"

import redis from "redis";
import Push from "../src/push";
import Pull from "../src/pull";
import expect from "expect";

// Create another connection as Pull clients are blocked
var client = redis.createClient();

describe("Pull", function () {

  var queue = "_test_push_pull_queue_";
  var pull;

  beforeEach(() => pull = new Pull({"queue": queue}));
  beforeEach((done) => client.del(queue, done));
  afterEach((done) => client.del(queue, done));
  afterEach(() => pull.end());

  it("should expose Redis client", function () {
    expect(pull._redisClient).toExist();
  });

  it("should emit 'data' when data is pushed", function (done) {
    var push = new Push({"queue": queue});
    var pushed = {"some": "data"};
    push.write(pushed);
    push.once("error", done);
    pull.once("error", done);
    pull.once("data", (pulled) => {
      expect(pulled).toEqual(pushed);
      push.end();
      done();
    });
  });

  it("should pause and resume", function (done) {
    pull.pause();
    var push = new Push({"queue": queue});
    push.write(42);
    var onUnexpectedData = () => done(new Error("Unexpected data: should be paused!"));
    pull.on("data", onUnexpectedData);
    setTimeout(() => {
      pull.removeListener("data", onUnexpectedData);
      pull.once("data", (pulled) => {
        expect(pulled).toEqual(42);
        done();
      });
      pull.resume();
    }, 500);
  });

  it("should handle data FIFO", function (done) {
    pull.pause();
    var push = new Push({"queue": queue});
    push.write({"order": 1});
    push.write({"order": 2});
    push.write({"order": 3});
    push.once("error", done);
    pull.once("error", done);
    var i = 1;
    var onData = (pulled) => {
      expect(pulled.order).toEqual(i++);
      if (i === 4) {
        done();
      } else {
        pull.once("data", onData);
      }
    };
    pull.once("data", onData);
    pull.resume();
  });

});
