module.exports = function (app, addon) {

    // Root route. This route will serve the `atlassian-connect.json` unless the
    // documentation url inside `atlassian-connect.json` is set
    app.get('/', function (req, res) {
        res.format({
            // If the request content-type is text-html, it will decide which to serve up
            'text/html': function () {
                res.redirect('/atlassian-connect.json');
            },
            // This logic is here to make sure that the `atlassian-connect.json` is always
            // served up when requested by the host
            'application/json': function () {
                res.redirect('/atlassian-connect.json');
            }
        });
    });

    // This is an example route that's used by the default "generalPage" module.
    // Verify that the incoming request is authenticated with Atlassian Connect
    app.get('/news-feed', addon.authenticate(), function (req, res) {
            // Rendering a template is easy; the `render()` method takes two params: name of template
            // and a json object to pass the context in
            var FeedParser = require('feedparser'), request = require('request');
            var newsItems = {
                newsitems: []
            };

            var req = request('https://www.sitepoint.com/feed'), feedparser = new FeedParser();

            req.on('error', function (error) {
                // handle any request errors
            });
            req.on('response', function (res) {
                var stream = this;

                if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));
                stream.pipe(feedparser);
            });

            feedparser.on('error', function (error) {
                // always handle errors
            });
            feedparser.on('readable', function () {
                // This is where the action is!
                var stream = this
                    , meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
                    , item;

                while (item = stream.read()) {
                    newsItems.newsitems.push({
                        'title': item.title,
                        'link': item.link
                    });
                }
                console.log(newsItems.newsitems);
            });

            feedparser.on('end', function () {
                res.render('news-feed', {
                    title: 'Latest SitePoint News',
                    newsitems: newsItems.newsitems
                });
            });

        }
    );

    // Add any additional route handlers you need for views or REST resources here...

    // load any additional files you have in routes and apply those to the app
    {
        var fs = require('fs');
        var path = require('path');
        var files = fs.readdirSync("routes");
        for (var index in files) {
            var file = files[index];
            if (file === "index.js") continue;
            // skip non-javascript files
            if (path.extname(file) != ".js") continue;

            var routes = require("./" + path.basename(file));

            if (typeof routes === "function") {
                routes(app, addon);
            }
        }
    }
};
