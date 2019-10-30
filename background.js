chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.id == "setupComments") {
        var page = $.ajax({
          url: "https://old.reddit.com" + request.permalink,
          async: false,
          xhrFields: {
            withCredentials: true
          }
        });
      sendResponse({response: page.responseText.replace(/<\s*head[^>]*>.*?<\s*\/\s*head>/g, '')});
    } else if (request.id == "getThreads") {
      var threads = $.Deferred();
      $.when(...request.urls.map(url => $.ajax({url: url}))).then(function(...args) {
        const threads = [];
        args.forEach(r => r[0].data.children.forEach(t => threads.push(t)));
        sendResponse({response: threads})
      });
    } else if (request.id == "moreChildren") {
      var page = $.ajax({
        dataType: "json",
        url: request.url,
        async: false,
        xhrFields: {
          withCredentials: true
        }
      });
      sendResponse({response: page.responseText});
    } else if (request.id == "checkNSFW") {
        var page = $.ajax({
          url: "https://old.reddit.com/r/announcements/comments/aep20/about_the_little_red_nsfw_that_appears_next_to/",
          async: false,
          xhrFields: {
            withCredentials: true
          }
        });
        sendResponse({response: page.responseText});
    };
    return true;
  }
);
