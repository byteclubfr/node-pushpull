"use strict";

import redisClient from "./redis-client";
import {Writable} from "stream";

export default class Push extends Writable {
  constructor (options = {}) {
    super({ "objectMode": true });

    var {queue} = options;

    if (!queue) {
      throw new Error("Mandatory option 'queue' not set");
    }

    this._queue = queue;
    this._redisClient = redisClient(options);

    this._redisClient.on("error", (err) => this.emit("error", err));
  }

  _write (data, encoding, cb) {
    this._redisClient.rpush(this._queue, JSON.stringify(data), (err) => {

      // Events 'error' and 'pushed' may be emitted anyway
      if (err) {
        cb(err);
      } else {
        this.emit("pushed", data);
        cb();
      }

    });
  }

  end () {
    super.end();
    this._redisClient.end();
  }
}
