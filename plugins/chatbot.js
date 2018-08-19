// basic module export to tell nodejs where to start
function chatbot(bot) {
  this.bot = bot;
  main(bot);
}
module.exports = chatbot;

// main function for this plugin
function main(bot) {
  // add requirements
  const Cleverbot = require('cleverbot-node');
  const dialogflow = require('dialogflow');

  // instantiate a DialogFlow client.
  const sessionClient = new dialogflow.SessionsClient({
    keyFilename: bot.config.df_keyfilePath,
  });

  // instantiate cleverbot api
  cleverbot = new Cleverbot();
  cleverbot.configure({
    botapi: bot.config.cb_apikey,
  });

  // define session path
  const sessionPath = sessionClient.sessionPath(
    bot.config.df_projectId,
    bot.config.df_sessionId
  );

  // plugin just started
  let started = true;

  replyListener();
  // get reply message
  function getAnswer(msg, data, callback) {
    // the text query request.
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          // dialogflow only accepts 256 bytes so remove some of it
          text: msg.substring(0, 200),
          languageCode: bot.config.df_language,
        },
      },
    };
    // send request and callback result
    sessionClient
      .detectIntent(request)
      .then((responses) => {
        const result = responses[0].queryResult;
        callback(result.fulfillmentText, data);
      })
      .catch((err) => {
        console.error('ERROR:', err);
      });
  }

  // this acts as a cache to see whether a user has already been followed
  let cache = [];

  // gets a list of replies that have been made
  function replyListener() {
    bot.steem.api.getState('/@' + bot.config.user + '/recent-replies', function(
      err,
      result
    ) {
      // console.log(err, result);
      let content = result.content;
      replyGenerator(content);
    });
  }

  // filter posts that are actually comments
  function replyGenerator(content) {
    let o = 0;
    let len = Object.keys(content).length;
    for (let i in content) {
      if (content[i] !== undefined) {
        // checks whether a message has already been answered
        if (started === false && cache[content[i].permlink] === undefined) {
          cache[content[i].permlink] = content[i].author;
          let body = content[i].body;
          if (body.length > 1) {
            handleMessage(content, body, i, o, len);
          } else {
            // waits until it rechecks the replies for new ones
            setTimeout(replyListener, 10000);
          }
        } else {
          cache[content[i].permlink] = content[i].author;
          if (o === len - 1) {
            started = false;
            setTimeout(replyListener, 10000);
          }
        }
        o++;
      }
    }
  }

  // main message handling function
  function handleMessage(content, body, i, o, len) {
    console.log(body);
    // replace texts in parenthesis
    let editedBody = body
      .replace(/ *\([^)]*\) */g, '')
      .replace(/\[(.*?)\]/g, '')
      .replace(/\*\*\*\*/g, '');
    let data = {
      author: content[i].author,
      permlink: content[i].permlink,
    };
    if (data.author !== bot.config.user) {
      // get answer from dialogflow for the specific message
      getAnswer(editedBody, data, function(res, data) {
        // checks list of intends and whether it can handle the message
        if (res !== undefined && res.length > 2) {
          // create and add a comment broadcast to the main queue
          bot.execQueue.unshift(
            function(callback) {
              // basic comment broadcast
              // using catch for later permlink and long discussions handling
              bot.steem.broadcast.comment(
                bot.wif,
                data.author,
                data.permlink,
                bot.config.user,
                data.user +
                  ('-re-' + data.author + data.permlink).substr(0, 200),
                '',
                res,
                '{"app":"bostrot/0.1"}',
                function(err, result) {
                  if (err === null || err === undefined) {
                    console.log(
                      'Dialogflow replied on ' +
                        data.author +
                        ' ' +
                        data.permlink
                    );
                  } else {
                    console.log(err, result);
                  }
                  callback('DIALOGFLOW');
                  // when all messages have been handled
                  if (o === len - 1) {
                    replyListener();
                  }
                }
              );
            },
            function(err) {}
          );
        } else {
          // use cleverbot instead
          // create and add a comment broadcast to the main queue
          bot.execQueue.unshift(
            function(callback) {
              cleverbot.write(content[i].editedBody, function(response) {
                let res = response.output;
                bot.steem.broadcast.comment(
                  bot.wif,
                  data.author,
                  data.permlink,
                  bot.config.user,
                  data.user +
                    ('-re-' + data.author + data.permlink).substr(0, 200),
                  '',
                  res,
                  '{"app":"bostrot/0.1"}',
                  function(err, result) {
                    if (err === null || err === undefined) {
                      console.log(
                        'Cleverbot replied on ' +
                          data.author +
                          ' ' +
                          data.permlink
                      );
                    } else {
                      console.log(err, result);
                    }
                    callback('CLEVERBOT');
                    // when all messages have been handled
                    if (o === len - 1) {
                      replyListener();
                    }
                  }
                );
              });
            },
            function(err) {}
          );
        }
      });
    }
  }
}
