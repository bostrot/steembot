// basic module export to tell nodejs where to start
function autovote(bot) {
    this.bot = bot;
    createdListener();
}
module.exports = autovote;

// this acts as a cache to see whether a vote has already been done
var cache = [];

// just a handler to pass data to an inner function
function voteSubmitter(data, callback) {
    callback(data);
}

// this will listen on newly created discussions/posts
function createdListener() {
    // gets latest 100 discussions from steem and checks if their payout is higher than 0.01
    this.bot.steem.api.getDiscussionsByCreated({
        limit: 100
    }, function(err, result) {
        var content = result;
        var payout;
        for (var i in content) {
            payout = parseFloat(content[i].pending_payout_value.replace(" SBD"));
            // check whether vote has already been done and if the e.g. payout is higher than a value
            if ((payout > 0.01 && cache[content[i].permlink] === undefined)) {
                cache[content[i].permlink] = true;
                var data = {
                    author: content[i].author,
                    permlink: content[i].permlink,
                }
                // pass data per function to later asynchronous queue
                voteSubmitter(data, function(content) {
                    // this creates and adds a vote request with 60% power to the main queue where it waits for execution
                    this.bot.execQueue.push(function(callback) {
                        // basic voting broadcast
                        this.bot.steem.broadcast.vote(this.bot.wif, this.bot.config.user, content.author, content.permlink, 6000,
                            function(err, result) {
                                if (err === null || err === undefined) {
                                    console.log("Successfully upvoted " + content.author + " " + content.permlink);
                                } else {
                                    // quickly debug voting with uncommenting this and hide later for not spamming the console
                                    // console.log(err);
                                }
                                callback("VOTE");
                                // when all 100 posts have been checked and successfully voted (or not) on start again
                                if (i === content.length - 2) {
                                    createdListener();
                                }
                            });
                    }, function(err) {});
                })
            } else {
                // vote has already been done
                if (i === content.length - 2) {
                    createdListener();
                }
            }
        }
    })
}