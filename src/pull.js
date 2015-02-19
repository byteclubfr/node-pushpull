"use strict";

import redisClient from "./redis-client";
import {EventEmitter} from "events";

export default class Pull extends EventEmitter {
  constructor (options = {}) {
    var {
      queue,
      timeout = 60
    } = options;

    if (!queue) {
      throw new Error("Mandatory option 'queue' not set");
    }

    var client = this._redisClient = redisClient(options);

    client.on("error", (err) => this.emit("error", err));

    var loop = () => {
      if (this._paused) {
        setImmediate(loop);
      } else {
        client.blpop(queue, timeout, onPop(this, queue, loop));
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

function onPop (ev, queue, loop) {
  var onError = onLoopError(ev);

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

    if (resQueue !== queue) {
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

    if (ev._paused) {
      // Note we don't use an array: next loop tick won't trigger BLPOP
      // and _buffered_data won't be overriden until resume() is called
      ev._buffered_data = data;
    } else {
      ev.emit("data", data);
    }

    setImmediate(loop);
  };
}
