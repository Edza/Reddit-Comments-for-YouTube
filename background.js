chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
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
        $.when(...request.urls.map(url => getThread(url).catch(function(error) {
          console.error(`Failed to fetch ${url}: ${error}`)
        })
        )).then(function(...args) {
          const threads = [];
          if (args.every(element => element == null)) {
            sendResponse({response: false})
          } else {
            args.forEach(function(r) {
              if (r != null) {
                r.forEach(t => threads.push(t));
              }
            });
            sendResponse({response: threads})
          }
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

async function getThread(url) {
  return new Promise ((resolve, reject) => {
    const threads = [];
    $.ajax({
      url: url,
      xhrFields: {
        withCredentials: true
      }
    }).done(async function(response) {
      response.data.children.forEach(t => threads.push(t));
      if (response.data.after != null) {
        trimmedUrl = url.replace(/&after.*$/g, "");
        await getThread(`${trimmedUrl}&after=${response.data.after}`).then(value => {
          moreThreads = value;
          threads.push(...value);
        }, error => {
          console.error(`Failed to fetch ${url}: ${error}`);
        })
      }
      resolve(threads);
    }).fail(function(response, status, error) {
      reject(status);
    })
  })
}