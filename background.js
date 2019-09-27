chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.id == "setupComments") {
        var page = $.ajax({url: "https://old.reddit.com" + request.permalink, async: false});
        sendResponse({response: page.responseText});
    } else if (request.id == "getThreads") {
      var threads = $.Deferred();
      $.when(...request.urls.map(url => $.ajax({url: url}))).then(function(...args) {
        const threads = [];
        args.forEach(r => r[0].data.children.forEach(t => threads.push(t)));
        sendResponse({response: threads})
      });
    }
    return true;
  }
);
