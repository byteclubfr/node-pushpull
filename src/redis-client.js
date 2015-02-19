"use strict";

import redis from "redis";
import {defaults} from "lodash";

export default function (options = {}) {
  var {
    host = "localhost",
    port = 6379,
    client,
    database
  } = options;

  if (!client) {
    client = redis.createClient(port, host);
  }

  if (database) {
    client.select(database);
  }

  return client;
}
