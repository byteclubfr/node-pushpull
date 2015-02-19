"use strict";

var options = { "queue": "sample_queue" };

var pushpull;
try {
  pushpull = require("./");
} catch (e) {
  console.log("You have to build 'lib' directory first: run `npm run prepublish`");
  console.error(e);
  process.exit(1);
}

// Pullers

var Pull = pushpull.Pull;

var worker1 = new Pull(options);
worker1.on("data", function (data) {
  console.log("received data (1)", data);
});

var worker2 = new Pull(options);
worker2.on("data", function (data) {
  console.log("received data (2)", data);
});

// Pusher

var Push = pushpull.Push;

var sender = new Push(options);

for (var i = 0; i < 20; i++) {
  sender.write("data " + i);
}
