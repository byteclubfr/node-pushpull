"use strict";

var options = { "queue": "sample_queue" };

// Pullers

var Pull = require("./").Pull;

var worker1 = new Pull(options);
worker1.on("data", function (data) {
  console.log("received data (1)", data);
});

var worker2 = new Pull(options);
worker2.on("data", function (data) {
  console.log("received data (2)", data);
});

// Pusher

var Push = require("./").Push;

var sender = new Push(options);

for (var i = 0; i < 20; i++) {
  sender.write("data " + i);
}
