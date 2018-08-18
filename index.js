var async = require("async");
const pluginsFolder = './plugins/';
const fs = require('fs');

// queue for loading external data
var loadingQueue = async.queue(function (task, callback) {
    task(callback);
}, 1);

// primary queue for all steemjs block tasks
var execQueue = async.queue(function (task, callback) {
    task(callback);
}, 1);

fs.readdirSync(pluginsFolder).forEach(file => {
    console.log("Loading plugin", file, "...");
    var plugin = require('./plugins/' + file);
    plugin(loadingQueue, execQueue);
})

// when the queue finishes do nothing
execQueue.drain = function (res) {}