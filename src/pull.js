"use strict";

import redisClient from "./redis-client";
import {Readable} from "stream";

export default class Pull extends Readable {
  constructor (options = {}) {
    super({ "objectMode": true });

    var {queue, timeout = 30} = options;

    if (!queue) {
      throw new Error("Mandatory option 'queue' not set");
    }

    this._timeout = timeout;
    this._queue = queue;
    this._redisClient = redisClient(options);

    this._redisClient.on("error", (err) => this.emit("error", err));
  }

  _read () {
    var loop = () => {
      this._redisClient.blpop(this._queue, this._timeout, onPop(this, loop));
    };
    loop();
  }

  end () {
    this._redisClient.end();
    this.push(null);
  }
}

function onPop (pull, loop) {
  return function (err, res) {
    if (err) {
      return pull.emit("error", err);
    }

    if (!res) {
      // No job fetched: try again
      return setImmediate(loop);
    }

    var resQueue, json;
    try {
      [resQueue, json] = res;
    } catch (e) {
      return pull.emit("error", new Error("Unexpected response for BLPOP: " + String(res)));
    }

    if (resQueue !== pull._queue) {
      return pull.emit("error", "Invalid queue: " + resQueue);
    }

    if (!json) {
      // Empty data: try again
      return setImmediate(loop);
    }

    var data;
    try {
      data = JSON.parse(json);
    } catch (e) {
      return pull.emit("error", e);
    }

    pull.push(data);
  };
}
