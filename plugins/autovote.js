/**
 * Starts the Autovoting.
 * @param {object} bot All functions from framework.
 * @returns {boolean} Whether it succeeds.
 */

// basic module export to tell nodejs where to start
function autovote(bot) {
  this.bot = bot;
  createdListener();
}
module.exports = autovote;

// this acts as a cache to see whether a vote has already been done
let cache = [];

// just a handler to pass data to an inner function
function voteSubmitter(data, callback) {
  callback(data);
}

// this will listen on newly created discussions/posts
function createdListener() {
  // gets latest 100 discussions from steem and checks their payout
  this.bot.steem.api.getDiscussionsByCreated(
    {
      limit: 100,
    },
    function(err, result) {
      let content = result;
      let payout;
      for (let i in content) {
        if (content[i] !== undefined) {
          vote(content, payout, i);
        }
      }
    }
  );
}

function vote(content, payout, i) {
  payout = parseFloat(content[i].pending_payout_value.replace(' SBD'));
  // check whether vote has already been done
  if (payout > 0.01 && cache[content[i].permlink] === undefined) {
    cache[content[i].permlink] = true;
    let data = {
      author: content[i].author,
      permlink: content[i].permlink,
    };
    // pass data per function to later asynchronous queue
    voteSubmitter(data, function(content) {
      // this creates and adds a vote request to the main queue
      this.bot.execQueue.push(
        function(callback) {
          // basic voting broadcast
          this.bot.steem.broadcast.vote(
            this.bot.wif,
            this.bot.config.user,
            content.author,
            content.permlink,
            6000,
            function(err, result) {
              if (err === null || err === undefined) {
                console.log(
                  'Successfully upvoted ' +
                    content.author +
                    ' ' +
                    content.permlink
                );
              }
              callback('VOTE');
              // start again on finish
              if (i === content.length - 2) {
                createdListener();
              }
            }
          );
        },
        function(err) {}
      );
    });
  } else {
    // vote has already been done
    if (i === content.length - 2) {
      createdListener();
    }
  }
}
