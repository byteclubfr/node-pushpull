"use strict";

import redisClient from "./redis-client";
import {EventEmitter} from "events";

export default class Push extends EventEmitter {
  constructor (options = {}) {
    var {queue} = options;

    if (!queue) {
      throw new Error("Mandatory option 'queue' not set");
    }

    this._queue = queue;
    this._redisClient = redisClient(options);

    this._redisClient.on("error", (err) => this.emit("error", err));
  }

  write (data, cb) {
    this._redisClient.rpush(this._queue, JSON.stringify(data), (err) => {

      // Can specify a one-shot callback
      if (cb) {
        process.nextTick(() => cb(err, data));
      }

      // Events 'error' and 'pushed' may be emitted anyway
      if (err) {
        this.emit("error", err);
      } else {
        this.emit("pushed", data);
      }

    });
  }

  end () {
    this._redisClient.end();
  }
}
