## [steembot](https://github.com/bostrot/steembot)

A simple Steem Bot framework in NodeJS. You can easily create your own plugins and integrate those within the bot. 
This concept should be able to unify bot development on steem to create awesome bots.

## Features

* Automatic plugin detection
* Easy and fast deployment
* High customizability
* Unified plugins

## Included plugins

Some example plugins are:

* chatbot # this is a bot that answers replies with either dialogflow intends or cleverbot
* autofollow # a simple bot that follows people who just posted something
* autovote # a simple bot that upvotes people who just posted something
* add your own to the list via pull request

## Concept

Altough the core exists of very little code the concept of a bot framework with plugins is very important to me. 
The core primarily imports everything from the plugins folder and tries to use it as standard modules while also
adding the predefined main libraries. Those are currently `steem` and `config` where config is a file that handles
all custom configurations. The core exists of an async function imported from the async package which will handle 
one request at a time to keep this as light as possible while also not hitting API limits.

## Get started

This requires Node.js to work. If you have installed it, simply run:

    git clone https://github.com/bostrot/steembot
    cd steembot
    npm i
    
 Now fill out the `config.js` file and start it with:
 
    node index.js

For a daemon you can use upstart or screen. (though screen only for development).

## Build your own plugin

Kept relatively simple there are only two things to do when developing your own plugin. Adding a module export with
a function:

    function autofollow(bot) {
        this.bot = bot;
        main(); // execute some function
    }
    module.exports = chatbot;

This already lays the simple foundation while the config and main functions are loaded via the `bot` object. Then just
add a function to the async queue which will then be executed as soon as it is ready:
    
    this.bot.execQueue.push(
        function(callback) {
            // some stuff
            callback("FINISHED");
        }, function(err) {}
    );

Credentials in config:

    this.bot.config.user
    this.bot.config.key

Steemjs function. Read [steem-js API docs](https://github.com/steemit/steem-js/tree/master/doc#api) for full documentation.

    this.bot.steem

Our synchronous async queue:

    this.bot.execQueue


## Example plugin

You can find examples in the plugin folder and here:

    function echo(bot) {
        main(bot);
    }
    module.exports = echo;

    function main(bot) {
        bot.execQueue.push( // add to execution queue
            function(callback) {
                bot.steem.broadcast.comment(bot.wif, parentAuthor, parentPermlink, bot.config.user, permlink, title, body, jsonMetadata, function(err, result) {
                    console.log(err, result);
                    callback("COMMENTED"); // should callback a string
                });
            },
            function(err) {}
        );
    }


## Help

You are welcome to contribute with pull requests, bug reports, ideas and donations. Join the forum if you have any general purpose questions: [bostrot.com](https://www.bostrot.com)

Bitcoin: [1ECPWeTCq93F68BmgYjUgGSV11XuzSPSeM](https://www.blockchain.com/btc/payment_request?address=1ECPWeTCq93F68BmgYjUgGSV11XuzSPSeM&currency=USD&nosavecurrency=true&message=Bostrot)

PayPal: [paypal.me/bostrot](https://paypal.me/bostrot)

Hosting: [Get $50 free VPS credit on Vultr](https://www.bostrot.com/?ref=hosting)
