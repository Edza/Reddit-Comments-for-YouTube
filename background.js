chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    let formData = new FormData();
    if (request.data) {
      for (let key in request.data) {
        formData.append(key, request.data[key]);
      }
    }
    switch(request.id) {
      case "setupComments":
        fetch("https://old.reddit.com" + request.permalink + request.sort).then(response => response.text()).then(text => sendResponse({response: text.replace(/<\s*head[^>]*>.*?<\s*\/\s*head>/g, '')}));
        break;

      case "getThreads":
        Promise.all(request.urls.map(url => getThread(url)
        )).then(args => {
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
        fetch("https://old.reddit.com/api/morechildren", {
          method: "POST",
          body: formData
        }).then(response => response.json()).then(json => sendResponse({response: json}));
        break;

      case "getMe":
        fetch("https://old.reddit.com/api/me.json").then(response => response.json()).then(json => sendResponse({response: json}));
        break;

      case "vote":
        fetch("https://old.reddit.com/api/vote", {
          method: "POST",
          body: formData
        });
        break;

      case "comment":
        fetch("https://old.reddit.com/api/comment", {
          method: "POST",
          body: formData
        }).then(response => response.json()).then(json => sendResponse({response: json}));
        break;

      case "edit":
        fetch("https://old.reddit.com/api/editusertext", {
          method: "POST",
          body: formData
        }).then(response => response.json()).then(json => sendResponse({response: json}));
        break;

      case "delete":
        fetch("https://old.reddit.com/api/del", {
          method: "POST",
          body: formData
        }).then(response => response.json()).then(json => sendResponse({response: json}));
        break;
    }
    return true;
  }
);

async function getThread(url) {
  return new Promise ((resolve, reject) => {
    const threads = [];
    fetch(url).then(response => response.json()).then(async function(json) {
      json.data.children.forEach(t => threads.push(t));
      if (json.data.after != null) {
        trimmedUrl = url.replace(/&after.*$/g, "");
        await getThread(`${trimmedUrl}&after=${json.data.after}`).then(value => {
          moreThreads = value;
          threads.push(...value);
        }, error => {
          console.error(`Failed to fetch ${url}: ${error}`);
        })
      }
      resolve(threads);
    }).catch((error) => reject(error))
  })
}