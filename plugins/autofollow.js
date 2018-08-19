// basic module export to tell nodejs where to start
function autofollow(bot) {
  this.bot = bot;
  getAccounts(function(authors) {
    followHandler(authors, bot.config.user, bot.config.key);
  });
}
module.exports = autofollow;

// get a list of authors from steem and put them in an array
function getAccounts(callback) {
  let authors = [];
  this.bot.steem.api.getDiscussionsByCreated(
    {
      limit: 100,
    },
    function(err, result) {
      if (result !== undefined) {
        for (let i in result) {
          if (result[i] !== undefined) {
            authors.push(result[i]['author']);
            if (i == result.length - 1) {
              callback(authors);
            }
          }
        }
      }
    }
  );
}

// just a handler to pass data to an inner function
function dataHandler(data, callback) {
  callback(data);
}

// this acts as a cache to see whether a user has already been followed
let cache = [];

// main follow function that uses the author list from getAccounts()
function followHandler(authors) {
  for (let i in authors) {
    if (authors[i] !== undefined) {
      let data = {
        author: authors[i],
      };
      follow(data, authors, i);
    }
  }
}

// main follow handler
function follow(data, authors, i) {
  // checks whether we already followed this author
  if (cache[authors[i]] === undefined) {
    cache[authors[i]] = 0;
    dataHandler(data, function(data) {
      // this creates and adds a follow request to the main queue
      this.bot.execQueue.push(
        function(callback) {
          // basic following broadcast
          this.bot.steem.broadcast.customJson(
            this.bot.wif,
            [],
            [this.bot.config.user],
            'follow',
            JSON.stringify([
              'follow',
              {
                follower: this.bot.config.user,
                following: data.author,
                what: ['blog'],
              },
            ]),
            function(err, result) {
              if (err === null || err === undefined) {
                console.log('Successfully following ' + data.author);
              }
              // queue finished start again
              if (i == authors.length - 5) {
                getAccounts(function(authors) {
                  followHandler(authors, bot.config.user, bot.config.key);
                });
              }
              callback('FOLLOW');
            }
          );
        },
        function(err) {}
      );
    });
  }
}
