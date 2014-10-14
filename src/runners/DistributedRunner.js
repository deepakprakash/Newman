var jsface     = require("jsface");
var _          = require("lodash");
var Options    = require('../utilities/Options');
var request    = require('unirest');
var log        = require('../utilities/Logger');
var fs         = require('fs');
var url        = require('url');
var path       = require('path');


/**
 * @class DistributedRunner
 * @param Hosts {JSON} Takes a list of slaves as the input
 * @param Options {JSON} Set of options to pass to the slave
 */
var DistributedRunner = jsface.Class([Options], {
    constructor: function(hosts, options) {
        // TODO: Sanity checks for arguments?
        this.setOptions(options);
        this.hosts = hosts;

        this.completeCount = 0;
    },

    execute: function() {
        var that = this;

        // Iterate through each host and fire off requests.
        _(this.hosts).forEach(function(host){
            var rUrl = url.resolve(host.host, '/run/');

            var data = {
                'collectionUrl': that.getOptions().collectionUrl,
                'envJson': that.getOptions().envJson
            };


            request.post(rUrl).type('json').send(data).end(function(data) {

                // Increment the completeCount
                that.completeCount += 1;

                if (data.error) {
                    log.warn('Remote run at ' + rUrl + ' failed with error: ' + data.error + '\n');

                    // Set the host.result to an error
                    host.result = {
                        'error': data.error
                    };
                } else {
                    log.success('Remote run at ' + rUrl + ' succeeded.\n');
                    host.result = data;
                }

                if (that.completeCount === that.hosts.length) {
                    // All the requests have completed. Dump the results.
                    that.exportReport();
                }

            });

        });
    },

    consolidateResults: function() {
        var results = {};

        _(this.hosts).forEach(function(host){
            results[host.host] = host.result;
        });

        return results;
    },

    exportReport: function() {
        if (this.getOptions().outputFile) {
            var results = this.consolidateResults();

            var filepath = path.resolve(this.getOptions().outputFile);
            fs.writeFileSync(filepath , JSON.stringify(results, null, 2));
            log.note("\n\nOutput Log: " + filepath + "\n");
        }
    }
});

module.exports = DistributedRunner;
