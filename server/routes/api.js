const express = require('express');
const router = express.Router();
var util = require("util");
var url = require('url');
var through = require("through");
var mongoose = require('mongoose');

const CrawlKit = require('./../../crawlkit/src/index');
const SameDomainLinkFinder = require('../finders/SameDomainLinkFinder');
const A11yDeveloperToolsRunner = require('crawlkit-runner-accessibility-developer-tools');


//FINDER
function setCharAt(str, index, chr) {
  if (index > str.length - 1) return str;
  return str.substr(0, index) + chr + str.substr(index + 1);
}

/* GET api listing. */
router.get('/crawl', (req, res) => {
  var site = req.query.site;
  if (!/^https*:\/\//.test(site)) {
    site = "http://" + site;
  }
  const crawler = new CrawlKit(site);
// You could add a finder here in order to audit a whole network of pages
  crawler.setFinder(new SameDomainLinkFinder(site));

  crawler.addRunner('a11y-dev-tools', new A11yDeveloperToolsRunner());

  res.writeHead(200, {"Content-Type": "text/plain"});

  const stream = crawler.crawl(true);
  stream.on('end', () => {
    /* eslint-disable no-console */
    console.log('done!');
  });
  stream.pipe(through(function (item) {
    var origItem = item;
    item = item.trim();
    //item is the string of the JSON that we've got so far, including an opening and closing } on the first and last items.

    //Transformation:
    // If the first character is a comma, switch it to a bracket
    // If the last character isn't a bracket, add one
    // Take the topmost items name, and place it's value in runners.a11y-dev-tools.result
    // Serialize the JSON

    var firstBracket, firstComma = false;


    if (item.charAt(0) === ",") {
      item = setCharAt(item, 0, "{");
      firstComma = true;
    } else {
    }
    item += "}";

    try {
      item = JSON.parse(item);
      var site = Object.keys(item)[0];
      item[site].runners["a11y-dev-tools"].result["site"] = site;
      item = JSON.stringify(item);
      if (firstComma) {
        item = setCharAt(item, 0, ",");
      }
      item = item.substring(0, item.length - 1);

      this.queue(item);
    } catch(e) {
      this.queue(origItem);
    }
  })).pipe(res);
});

// var x =


module.exports = router;

