"use strict";

import redisClient from "./redis-client";
import {EventEmitter} from "events";

export default class Push extends EventEmitter {
  constructor (options = {}) {
    var {queue} = options;

    if (!queue) {
      throw new Error("Mandatory option 'queue' not set");
    }

    var client = this._redisClient = redisClient(options);

    client.on("error", (err) => this.emit("error", err));

    this.on("data", (data, cb) => client.rpush(queue, JSON.stringify(data), (err) => {

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

    }));
  }

  end () {
    this._redisClient.end();
  }
}
