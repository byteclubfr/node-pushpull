[![Build Status](https://img.shields.io/travis/lmtm/node-pushpull/master.svg?style=flat)](https://travis-ci.org/lmtm/node-pushpull)
[![Dependency Status](https://david-dm.org/lmtm/node-pushpull.svg?style=flat)](https://david-dm.org/lmtm/node-pushpull)
[![devDependency Status](https://david-dm.org/lmtm/node-pushpull/dev-status.svg?style=flat)](https://david-dm.org/lmtm/node-pushpull#info=devDependencies)

Push/Pull
=========

Implement a Push/Pull mecanism using Redis as backend. This pattern is typically used to handle pool of workers.

Installation
------------

```sh
npm install --save pushpull
```

You may want to install `hiredis` to, whenever possible:

```sh
npm install --save-optional hiredis
```

Usage
-----

Look at (and run) [`sample.js`](./sample.js) for a working example.

```js
// Worker

var Pull = require("./").Pull;

var worker = new Pull(options);
worker.on("data", function (data) {
  // do something with data
});

// Sender

var Push = require("./").Push;

var sender = new Push(options);
sender.emit("data", {"some": "data"});
```

Pull API
--------

* **`new Pull(options)`**: constructor, see *Options* below
* **`data` event**: emitted when data has been pulled from queue
* **`error` event**: emitter when an error occurs (seriously)
* **`pause()`**: stop querying for more data
  * IMPORTANT: this method cannot interrupt current fetch, which means **one** job can be pulled before puller is actually paused. This data will be buffered and emitted again as soon as you call `resume()`.
* **`resume()`**: quit pause
* **`end()`**: close the underlying Redis client, which obviously prevents any further query

Push API
--------

* **`new Push(options)`**: constructor, see *Options* below
* **`write(data)`**: emit this event to push a job to queue
* **`pushed` event**: emitted when data has been pushed successfully
* **`error` event**: emitter when an error occurs (seriously)
* **`end()`**: close the underlying Redis client, which obviously prevents any further query

Options
-------

* **`queue`** (mandatory): queue name, to be shared between worker(s) and sender(s)
  * Note: a Redis list with this name will be created. No decoration added, if you want to ensure unicity of the name, it's up to you to add prefix or suffix
* **`timeout`** (Pull only, default = 30 seconds): timeout between two `BLPOP` commands, the lower the value, the higher the chance not to grab data when calling `pause()`
* **`client`**: the Redis client to be used
  * IMPORTANT: a `Pull` instance will run `BLPOP` commands, which **BLOCK** the client. It's highly advised to use a unique client for each puller.
* **`host`** (default = localhost): Redis host (if `client` is not set)
* **`port`** (default = 6379): Redis port (if `client` is not set)
* **`database`**: Redis database to select once connected, if set

TODO
----

* The API *looks like* streams, but it's not real streams. Make it real.
