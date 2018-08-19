const async = require('async');
const pluginsFolder = './plugins/';
const fs = require('fs');
const steem = require('steem');
const config = require('./config.js');

// queue for loading external data
let loadingQueue = async.queue(function(task, callback) {
    task(callback);
}, 1);

fs.readdirSync(pluginsFolder).forEach((file) => {
    console.log('Loading plugin', file, '...');
    // primary queue for all steemjs block tasks
    let execQueue = async.queue(function(task, callback) {
        task(callback);
    }, 1);
    let plugin = require('./plugins/' + file);
    let bot = {
        loadingQueue,
        execQueue,
        steem: steem,
        config,
        wif: steem.auth.toWif(config.user, config.key, 'posting'),
    };
    plugin(bot);
});
