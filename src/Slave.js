var jsface  = require('jsface');
var http    = require('http');
var request = require('unirest');

var connect = require('connect');
var bodyParser = require('body-parser');
var logger = require('morgan');
var connectRoute = require('connect-route');

var Newman = require('./Newman');

/**
 * @name Slave
 */
var Slave = jsface.Class({
    $singleton: true,

    start: function (port) {

        if(typeof port === 'undefined') {
            console.log("Port not specified for slave server. Using default port 4000.");
            port = 4000;
        }

        var app = connect();
        app.use(logger('dev'));
        app.use(bodyParser.json());

        app.use(connectRoute(function (router) {
            router.get('/', function (req, res, next) {
                res.end('Please use the /run/ end point.');
            });

            router.post('/run/', function (req, res, next) {
                res.setHeader('Content-Type', 'application/json');

                var newmanOptions = req.body;

                request.get(newmanOptions.collectionUrl).type('json').end(function(data) {
                    if (data.error) {
                        // TODO: Return error
                        return;
                    }
                    Newman.execute(data.body, newmanOptions, function(exitCode, results) {
                        var response = {
                            'results': results
                        };
                        res.end(JSON.stringify(response, null, 2));
                    });
                });

            });
        }));


        http.createServer(app).listen(port);
        console.log("Running in slave mode!\nWaiting for requests..");
    }
});

module.exports = Slave;
