"use strict";

import redisClient from "./redis-client";
import {EventEmitter} from "events";

export default class Pull extends EventEmitter {
  constructor (options = {}) {
    var {
      queue,
      timeout = 30
    } = options;

    if (!queue) {
      throw new Error("Mandatory option 'queue' not set");
    }

    this._queue = queue;
    this._redisClient = redisClient(options);

    this._redisClient.on("error", (err) => this.emit("error", err));

    var loop = () => {
      if (this._paused) {
        setImmediate(loop);
      } else {
        this._redisClient.blpop(queue, timeout, onPop(this, loop));
      }
    };

    loop();
  }

  end () {
    this._redisClient.end();
  }

  pause () {
    this._paused = true;
  }

  resume () {
    if (this._buffered_data) {
      this.emit("data", this._buffered_data);
      this._buffered_data = null;
    }
    this._paused = false;
  }
}

function onLoopError (ev) {
  return (err, loop) => {
    ev.emit("error", err);
    setImmediate(loop);
  }
}

function onPop (pull, loop) {
  var onError = onLoopError(pull);

  return function (err, res) {
    if (err) {
      return onError(err, loop);
    }

    if (!res) {
      return setImmediate(loop);
    }

    var resQueue, json;
    try {
      [resQueue, json] = res;
    } catch (e) {
      return onError(new Error("Unexpected response for BLPOP: " + String(res)), loop);
    }

    if (resQueue !== pull._queue) {
      return onError("Invalid queue: " + resQueue, loop);
    }

    if (!json) {
      return setImmediate(loop);
    }

    var data;
    try {
      data = JSON.parse(json);
    } catch (e) {
      return onError(e, loop);
    }

    if (pull._paused) {
      // Note we don't use an array: next loop tick won't trigger BLPOP
      // and _buffered_data won't be overriden until resume() is called
      pull._buffered_data = data;
    } else {
      pull.emit("data", data);
    }

    setImmediate(loop);
  };
}
