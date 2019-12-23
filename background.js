chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch(request.id) {
      case "setupComments":
        var page = $.ajax({
          url: "https://old.reddit.com" + request.permalink + request.sort,
          async: false,
          xhrFields: {
            withCredentials: true
          }
        });
        sendResponse({response: page.responseText.replace(/<\s*head[^>]*>.*?<\s*\/\s*head>/g, '')});
        break;

      case "getThreads": 
        $.when(...request.urls.map(url => $.ajax({
          url: url,
          timeout: 10000
        }))).then(function(...args) {
          const threads = [];
          args.forEach(function(r) {
            if (r[2].status == 200) r[0].data.children.forEach(t => threads.push(t));
          });
          sendResponse({response: threads})
        });
        break; 

      case "moreChildren":
        var page = $.ajax({
          method: "POST",
          data: request.data,
          dataType: "json",
          url: "https://old.reddit.com/api/morechildren",
          async: false,
          xhrFields: {
            withCredentials: true
          }
        });
        sendResponse({response: page.responseJSON});
        break;

      case "getMe":
        var page = $.ajax({
          url: "https://old.reddit.com/api/me.json",
          async: false,
          xhrFields: {
            withCredentials: true
          }
        });
        sendResponse({response: page.responseJSON});
        break;

      case "vote":
        var page = $.ajax({
          method: "POST",
          data: request.data,
          url: "https://old.reddit.com/api/vote",
          async: false,
          xhrFields: {
            withCredentials: true
          }
        });
        break;

      case "comment":
        var page = $.ajax({
          method: "POST",
          data: request.data,
          url: "https://old.reddit.com/api/comment",
          async: false,
          xhrFields: {
            withCredentials: true
          }
        });
        sendResponse({response: page.responseJSON});
        break;

      case "edit":
        var page = $.ajax({
          method: "POST",
          data: request.data,
          url: "https://old.reddit.com/api/editusertext",
          async: false,
          xhrFields: {
            withCredentials: true
          }
        });
        sendResponse({response: page.responseJSON});
        break;

      case "delete":
        var page = $.ajax({
          method: "POST",
          data: request.data,
          url: "https://old.reddit.com/api/del",
          async: false,
          xhrFields: {
            withCredentials: true
          }
        });
        sendResponse({response: page.responseJSON});
        break;
    }
    return true;
  }
);
