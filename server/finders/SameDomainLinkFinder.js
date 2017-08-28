const genericAnchors = require('../../crawlkit-2/finders/genericAnchors');
const urijs = require("urijs");

class SameDomainLinkFinder {
  constructor(baseUrl) {
    this.baseUrl = urijs(baseUrl);
    this.visited = [];
  }

  getRunnable() {
    // the function returned here runs within the webpage. No closures, etc.
    return genericAnchors;
  }

  urlFilter(url) {
    var url = urijs(url).fragment("");
    if (
      url.domain() === this.baseUrl.domain()
      && !url.equals(this.baseUrl) &&
      !(
        url.pathname().endsWith(".png") ||
        url.pathname().endsWith(".jpeg") ||
        url.pathname().endsWith(".gif") ||
        url.pathname().endsWith(".jpg") ||
        url.pathname().endsWith(".pdf")
      )
      && !this.visited.includes()) {
      return url;
    } else {
      // not same domain - discard URL
      return false;
    }
  }
}

module.exports = SameDomainLinkFinder;
