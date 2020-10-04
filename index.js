var modhash;
var suspended = false;

document.addEventListener("click", event => {
  document.getElementsByClassName("drop-choices")[0].style.display = "none";
  let target = event.target;
  if (target.closest(".dropdown.lightdrop")) {
    document.getElementsByClassName("drop-choices")[0].style.display = "block";
    event.stopPropagation();
  } else if (target.classList.contains("toggleChildren")) {
    target.closest(".comment").classList.toggle("childrenHidden");
    target.closest(".comment").classList.add("childrenManuallyToggled");
  } else if (target.matches(".morecomments a")) {
    let clickArgs = target.getAttribute("clickArgs").substring('return morechildren('.length, target.getAttribute("clickArgs").length - 1).replace(/\'/g, "").split(", ");
    let morechildren = target.closest(".morechildren");
    target.style.color = "red";
    let data = {"link_id": clickArgs[1], "sort": clickArgs[2], "children": clickArgs[3], "id": target.getAttribute("id").slice(5, 100), "limit_children": clickArgs[4]};
    chrome.runtime.sendMessage({id: "moreChildren", data: data}, function(response) {
      let children = response.response.jquery[10][3][0];
      let eroot = morechildren.closest(".child, .commentarea");
      morechildren.remove();
      children.forEach((item, index) => {
        let htmlDoc = document.createElement("template");
        htmlDoc.innerHTML = decodeHTMLEntities(item.data.content);
        htmlDoc = clean_reddit_content(htmlDoc);
        htmlDoc.content.querySelectorAll(".child").forEach(element => element.insertAdjacentHTML("beforeend", `<div id="siteTable_${item.data.id}" class="sitetable listing"></div>`));
        eroot.querySelector(`#siteTable_${item.data.parent}`).append(htmlDoc.content);
      })
      collapseHelper();
    });
  } else if (target.matches(".child > form .usertext-buttons .save, .commentarea > form .usertext-buttons .save")) {
    target.disabled = true;
    let textarea = target.closest("form.usertext");
    let data = {thing_id: textarea.querySelector("input[name='thing_id']").getAttribute("value"), text: textarea.querySelector("textarea").value, uh: modhash}
    chrome.runtime.sendMessage({id: "comment", data: data}, function (response) {
      if (response.response.success == true) {
        let htmlDoc = document.createElement("template");
        htmlDoc.innerHTML = decodeHTMLEntities(response.response.jquery[response.response.jquery.length-4][3][0][0].data.content);
        htmlDoc = clean_reddit_content(htmlDoc);
        let parent = textarea.closest(".comment");
        if (parent) {
          textarea.closest(".comment").classList.remove("childrenHidden");
          textarea.closest(".comment").classList.add("childrenManuallyToggled");
        }
        textarea.parentElement.querySelector(".sitetable").prepend(htmlDoc.content);
        textarea.querySelector("span.status").textContent = "";
        if (textarea.classList.contains("removable")) {
          textarea.remove();
        } else {
          textarea.querySelector("textarea").value = "";
        }
      } else {
        textarea.querySelector("span.status").textContent = response.response.jquery[response.response.jquery.length-3][3][0];
      }
      collapseHelper();
    });
    target.disabled = false;
  } else if (target.classList.contains("edit-usertext")) {
    let parent = target.closest(".thing.comment");
    let entry = parent.querySelector(":scope > .entry");
    entry.querySelector(".usertext-body").style.display = "none";
    entry.querySelector(".usertext-edit").style.display = "block";
    entry.querySelectorAll(".usertext-buttons button").forEach(element => element.style.display = "inline-block");
    entry.querySelector(".usertext-edit button.save").onclick = function() {
      let data = {thing_id: parent.getAttribute("data-fullname"), text: parent.querySelector(".usertext-edit textarea").value, uh: modhash};
      chrome.runtime.sendMessage({id: "edit", data: data}, function (response) {
        if (response.response.success == true) {
          let htmlDoc = document.createElement("template");
          htmlDoc.innerHTML = decodeHTMLEntities(response.response.jquery[response.response.jquery.length-4][3][0][0].data.content);
          htmlDoc = clean_reddit_content(htmlDoc);
          entry.replaceWith(htmlDoc.content.querySelector(".entry"));
        } else {
          entry.querySelector("span.status").textContent = response.response.jquery[response.response.jquery.length-3][3][0];
        }
      });
    };
  } else if (target.matches(".reply-button a")) {
    let parentComment = target.closest(".thing.comment");
    let child = parentComment.querySelector(":scope > .child");
    if (!child.querySelector(":scope > form")) {
      child.insertAdjacentHTML("afterbegin", `
        <form action='#' class='usertext cloneable removable'>
        <input type='hidden' name='thing_id' value='${parentComment.getAttribute("data-fullname")}'>
            <div class='usertext-edit md-container' style='width: 500px;'>
                <div class='md'>
                  <textarea class='replybox'></textarea>
                </div>
                <div class='bottom-area'>
                    <div class='usertext-buttons'>
                        <button type='button' onclick='' class='save'>save</button>
                        <button type='button' onclick='this.closest("form").remove()' class='cancel' style=''>cancel</button>
                        <span class='status'></span>
                    </div>
                </div>
            </div>
        </form>
      `);
      child.querySelector("textarea.replybox").focus();
      if (!child.querySelector(":scope > .sitetable")) {
        child.insertAdjacentHTML("beforeend", `<div id="siteTable_${parentComment.getAttribute("data-fullname")}" class="sitetable listing">`);
      }
    }
  } else if (target.matches(".del-button a.yes")) {
    chrome.runtime.sendMessage({id: "delete", data: {id: target.closest(".thing.comment").getAttribute("data-fullname"), uh: modhash}});
    target.closest("form").innerHTML = "<span style='padding-right: 5px'>deleted</span>";
  } else if (target.classList.contains("arrow")) {
    parent = target.parentElement.parentElement;
    let direction;
    let classList = target.classList;
    if (classList.contains("up")) {
      direction = 1;
      classList.remove("up");
      classList.add("upmod");
      let downvote = target.parentElement.querySelector(".downmod");
      if (downvote != null) {
        downvote.classList.remove("downmod");
        downvote.classList.add("down");
      }
      parent.querySelectorAll(":scope > .unvoted, :scope > .dislikes").forEach(element => {
        element.classList.remove("unvoted");
        element.classList.remove("dislikes");
        element.classList.add("likes");
      });
    } else if (classList.contains("down")) {
      direction = -1;
      classList.remove("down");
      classList.add("downmod");
      let upvote = target.parentElement.querySelector(".upmod");
      if (upvote != null) {
        upvote.classList.remove("upmod");
        upvote.classList.add("up");
      }
      parent.querySelectorAll(":scope > .unvoted, :scope > .likes").forEach(element => {
        element.classList.remove("unvoted");
        element.classList.remove("likes");
        element.classList.add("dislikes");
      });
    } else {
      direction = 0;
      let upvote = target.parentElement.querySelector(".upmod");
      if (upvote != null) {
        upvote.classList.remove("upmod");
        upvote.classList.add("up");
      }
      let downvote = target.parentElement.querySelector(".downmod");
      if (downvote != null) {
        downvote.classList.remove("downmod");
        downvote.classList.add("down");
      }
      parent.querySelectorAll(":scope > .likes, :scope > .dislikes").forEach(element => {
        element.classList.remove("likes");
        element.classList.remove("dislikes");
        element.classList.add("unvoted");
      });
    }
    var data = {dir: direction, id: parent.getAttribute("data-fullname"), rank: 2, uh: modhash};
    chrome.runtime.sendMessage({id: "vote", data: data});
  }
});

document.addEventListener("keydown", function(event) {
    if (event.target.matches(".usertext-edit textarea")) {
      if (event.key == "Enter" && (event.ctrlKey || event.metaKey)) {
        event.target.closest("form").querySelector("button.save").click();
      }
    }
});

function collapseHelper() {
  document.querySelectorAll("#reddit_comments .comment").forEach(element => {
    if (element.querySelector(".child .sitetable")) {
      element.classList.add("hasChild");
    }
  });
  chrome.storage.sync.get({childrenHiddenDefault: "false"}, result => {
    if (result.childrenHiddenDefault == "true") {
      document.querySelectorAll("#reddit_comments .commentarea > .sitetable > *:not(.childrenManuallyToggled)").forEach(element => element.classList.add("childrenHidden"));
    };
  });
}

function display_error_message() {
  if (!navigator.onLine) {
    append_extension(false, "<h3 id='nothread'>Internet connection error. Please check your connection and reload the page.</h3>", "");
  } else {
    append_extension(false, "<h3 id='nothread'>Unknown error loading Reddit content. It is possible that Reddit is down or something in the extension went wrong.</h3>", "");
  }
  document.querySelector("#reddit_comments > #nav").remove();
}

function isDupe(item, array) {
  for (let i = 0; i < array.length; i++) {
    if (item.data.permalink == array[i].data.permalink) {
      return true;
    }
  }
  return false;
}

let sort = "votes";
if (localStorage && localStorage.getItem('rifSort')) {
  sort = localStorage.getItem('rifSort');
}

function sort_threads(threads) {
  return threads.sort(function(a, b) {
    let conda, condb;
    switch(sort) {
      case "subreddit":
        conda = a.data.subreddit.toLowerCase();
        condb = b.data.subreddit.toLowerCase();
        break;
      
      case "votes":
        conda = b.data.score;
        condb = a.data.score;
        break;

      case "comments":
        conda = b.data.num_comments;
        condb = a.data.num_comments;
        break;

      case "newest":
        conda = b.data.created;
        condb = a.data.created;
        break;
    }
    const namea = a.data.name.toLowerCase();
    const nameb = b.data.name.toLowerCase();
    return ((conda < condb) ? -1 : ((conda > condb) ? 1 : ((namea < nameb) ? -1 : 1)));
  });
}

function get_threads(v) {
  const requests = [
    'www.youtube.com',
    'm.youtube.com',
    'youtu.be'
  ].map(domain => `https://old.reddit.com/search.json?limit=100&sort=top&q=url:${v}+site:${domain}`);
  const threads = [];
  chrome.runtime.sendMessage({
      id: "getThreads",
      urls: requests
    }, function(response) {
      if (response.response) {
        setup_threads(response.response);
      }
      else (display_error_message());
    })
}

function setup_threads(threads) {
  var filtered = threads.filter(t => !t.data.promoted);
  chrome.storage.sync.get({subBlacklist: []}, function(result) {
    filtered = filtered.filter(t => !result.subBlacklist.includes(t.data.subreddit.toLowerCase()));
  });
  chrome.runtime.sendMessage({id: "getMe"}, function(meResponse) {
    modhash = meResponse.response.data.modhash;
    if (meResponse.response.data.is_suspended) {
      suspended = meResponse.response.data.is_suspended;
    }
    if (filtered.length > 0) {
      let sorted_threads = sort_threads(filtered);
  
      // Filter duplicates:
      var unique_threads = [];
      for(let i = 0; i < sorted_threads.length; i++) {
        if (!isDupe(sorted_threads[i], unique_threads)) {
          unique_threads.push(sorted_threads[i]);
        }
      }
  
      sorted_threads = unique_threads;
  
      let thread_select = document.createElement("template");
      thread_select.innerHTML = "<select id='thread_select'></select>";
      let starterTime = "";
  
      sorted_threads.forEach(function(thread, i) {
        const t = thread.data;
        const subreddit = "r/" + t.subreddit;
        // &#8679; is an upvote symbol, &#128172; is a comment symbol
        const forward = `${subreddit}, ${t.score}&#8679;, ${t.num_comments}&#128172;`;
        // Add in a dynamic number of spaces so that all the video titles line up
        const spaces = "&nbsp".repeat(52 - forward.length);
        // Chop off titles that are too long to fit on screen:
        const sliced_title = t.title.length < 65 ? t.title : t.title.slice(0, 60) + "...";

        let url = new URL(t.url.replace("&amp;", "&"));
        let time = url.searchParams.get("t");
        
        if (time) {
          if (isNaN(time)) {
            let newTime = 0;
            let hours = time.match(/\d*h/);
            let minutes = time.match(/\d*m/);
            let seconds = time.match(/\d*s/);
            if (hours) {
              newTime += (parseInt(hours[0]) * 3600);
            }
            if (minutes) {
              newTime += (parseInt(minutes[0]) * 60);
            }
            if (seconds) {
              newTime += (parseInt(seconds[0]));
            }
            time = newTime;
          } else {
            time = parseInt(time);
          }
        } else {
          time = "";
        }
  
        if (i === 0) {
          starterTime = time;
        }
  
        thread_select.content.getElementById("thread_select").insertAdjacentHTML("beforeend", `<option
          value="${t.permalink}"
          title="${t.title.replace(/\"/g,'&quot;')}"
          time="${time}"
          subreddit="${t.subreddit}"
          votes=${t.score}
          created=${t.created}
          comments=${t.num_comments}
          >${forward}${spaces} ${sliced_title}</option>`);
      });
  
      thread_select.content.getElementById("thread_select").onchange = function() {
        const comments = document.querySelector("#reddit_comments > #comments");
        while (comments.firstChild) {
          comments.removeChild(comments.lastChild);
        }
        const title = document.querySelector("#reddit_comments > #title");
        while (title.firstChild) {
          title.removeChild(title.lastChild);
        }
        title.insertAdjacentHTML("beforeend", "<h1>Loading Thread...</h1>");
        setup_comments(this.querySelector("option:checked").value, null, this.querySelector("option:checked").getAttribute("time"));
      };
      setup_comments(sorted_threads[0].data.permalink, thread_select, starterTime);
    } else {
      let redditComments = document.querySelector("#reddit_comments");
      if (redditComments) {
        while (redditComments.firstChild) {
          redditComments.removeChild(redditComments.lastChild);
        }
      }
      append_extension(false, "<h3 id='nothread'>No Threads Found</h3>", "");
      document.querySelector("#reddit_comments #nav").style.display = "none";
    }
  });
}

// URL variable keeps track of current URL so that if it changes we'll be able to tell
let url = "";

function load_extension() {
  // The v param of a YouTube URL is the video's unique ID which is needed to get Reddit threads about it
  const youtube_url = new URL(window.location.href);
  const video = youtube_url.searchParams.get("v");



  // Only load extension if v exists, which it won't on pages like the home page or settings
  if (window.location.href.match(/v=/)) {
    get_threads(video);
  }
}

function clean_reddit_content(content) {
  // Reddit threads have a lot of HTML content that, for this simplified extension,
  // are unnecessary. The following is the list of all things that aren't needed.
  const removables = `script, head, .panestack-title, .menuarea > div:last-child,
                      .gold-wrap, .numchildren, #noresults, .locked-error,
                      .domain, .flair, .linkflairlabel, .reportform,
                      .expando-button, .expando, .help-toggle, .reddiquette,
                      .userattrs, .parent, .commentsignupbar__container,
                      .promoted, .thumbnail, .crosspost-button, .report-button,
                      .give-gold-button, .hide-button, .buttons .share, .save-button, .embed-comment,
                      .link .flat-list, .comment-visits-box, .sendreplies-button, .remove-button,
                      form[action="/post/distinguish"], a[data-event-action="parent"],
                      li[title^="removed"], .hidden.choice`;
  content.content.querySelectorAll(removables).forEach(element => element.remove());
  content.content.querySelectorAll(".access-required.archived").forEach(element => element.style.visibility = "hidden");
  content.content.querySelectorAll("button").forEach(element => element.setAttribute("type", "button"));
  content.content.querySelectorAll(".morecomments a").forEach(element => {
    var onClick = element.getAttribute("onclick");
    element.setAttribute("clickArgs", onClick);
    element.removeAttribute("onclick")
  });
  content.content.querySelectorAll("a[data-event-action='delete'], .del-button a, .edit-usertext, .usertext-edit button, .dropdown.lightdrop").forEach(element => element.removeAttribute("onclick"));
  content.content.querySelectorAll("a[href='#']").forEach(element => element.setAttribute("href", "javascript:void(0)"));
  content.content.querySelectorAll("a[href='#s'], a[href='/s']").forEach(element => {
    element.setAttribute("href", "javascript:void(0)");
    element.classList.add("reddit_spoiler");
  });
  content.content.querySelectorAll("a[href^='/']").forEach(element => element.setAttribute("href", `https://www.reddit.com${element.getAttribute("href")}`));
  content.content.querySelectorAll("ul.flat-list.buttons").forEach(element => element.insertAdjacentHTML("beforeend", "<li><a href='javascript:void(0)' class='toggleChildren'></a></li>"));
  content.content.querySelectorAll("a.author, a[data-event-action='permalink']").forEach(element => element.setAttribute("href", element.getAttribute("href").replace("old.reddit.com", "www.reddit.com")));
  content.content.querySelectorAll("a:not(.choice):not([href^='javascript'])").forEach(element => element.setAttribute('target', '_blank'));

  if (suspended || modhash == null) {
    content.content.querySelectorAll(".commentarea > .usertext, .reply-button").forEach(element => element.remove());
    content.content.querySelectorAll(".arrow").forEach(element => element.style.visibility = "hidden");
  }
  return content;
}

function setup_comments(permalink, thread_select, time, sort = "") {
  chrome.runtime.sendMessage({id: "setupComments", permalink: permalink, sort: sort}, function(response) {
    if (response.response != null) {
      let page = document.createElement("template");
      page.innerHTML = response.response;
      page.content.querySelectorAll("a.title").forEach(element => element.setAttribute("href", "https://www.reddit.com" + permalink));
      page = clean_reddit_content(page);
      
      const header_html = page.content.querySelectorAll("#siteTable .link")[0].outerHTML;
      const comment_html = page.content.querySelectorAll(".commentarea")[0].outerHTML;

      append_extension(thread_select, header_html, comment_html, time);
    } else {
      display_error_message();
    }
  });
}

// Lots of elements in the Reddit comments have onclick handlers that call a function "click_thing()"
// In order to prevent a console error about an undefined function, this empty function is inserted in
// a script on the page
function click_thing(e) {
}

// This function handles the clicking of the expand button so a user can hide the Reddit extension
function toggle_expand() {
  document.querySelector("#reddit_comments > #nav").classList.toggle("reddit_hidden");
  document.querySelector("#reddit_comments > #title").classList.toggle("reddit_hidden");
  document.querySelector("#reddit_comments > #comments").classList.toggle("reddit_hidden");

  let expander = document.getElementById("reddit_expander")
  expander.textContent = (expander.textContent == "[–]") ? "[+]" : "[–]";
}

function togglecomment(e) {
  var t=e.parentElement.parentElement.parentElement;
  var r=t.classList.contains("collapsed");
  t.classList.toggle("collapsed");
  t.classList.toggle("noncollapsed");
  e.textContent = (e.textContent == "[–]") ? "[+]" : "[–]";
}

function decodeHTMLEntities(text) {
  var entities = [
    ['amp', '&'],
    ['apos', '\''],
    ['#x27', '\''],
    ['#x2F', '/'],
    ['#39', '\''],
    ['#47', '/'],
    ['lt', '<'],
    ['gt', '>'],
    ['nbsp', ' '],
    ['quot', '"'],
  ];

  for (var i = 0, max = entities.length; i < max; ++i) {
    text = text.replace(new RegExp('&'+entities[i][0]+';', 'g'), entities[i][1]);
  }

  return text;
}


function append_extension(thread_select, header, comments, time) {
  // If extension not already appended, append it:
  if (!document.querySelector("#reddit_comments")) {
    document.querySelector("#comments, #watch-discussion").insertAdjacentHTML("beforebegin", `
    <div id='reddit_comments' style='display: none'>
      <div id='top_bar'>
        <h2><a id="reddit_expander" href="javascript:void(0)" onclick="toggle_expand()">[–]</a> Reddit Comments</h2>
        <h2 id="thread_count"></h2>
      </div>
      <div id='nav'></div>
      <div id='title'></div>
      <div id='comments'></div>
    </div>`);
  }

  const redditComments = document.querySelector("#reddit_comments");

  // If passed a new thread dropdown, replace the old one
  if (thread_select) {
    const nav = redditComments.querySelector("#nav");
    while (nav.firstChild) {
      nav.removeChild(nav.lastChild);
    }
    nav.append(thread_select.content);

    if (!redditComments.querySelector("#mySortSelect")) {
      let sort_select = document.createElement("template");
      sort_select.innerHTML = `
        <div id="mySortSelect">
          <h2>Sort By:&nbsp;</h2>
          <select>
            <option value="votes" title="Score" ${sort === "votes" ? "selected" : ""}>Score</option>
            <option value="comments" title="Comments" ${sort === "comments" ? "selected" : ""}>Comments</option>
            <option value="subreddit" title="Subreddit" ${sort === "subreddit" ? "selected" : ""}>Subreddit</option>
            <option value="newest" title="Newest" ${sort === "newest" ? "selected" : ""}>Newest</option>
          </select>
        </div>
      `;

      sort_select.content.querySelector("select").onchange = function() {
        const new_sort = this.querySelector("option:checked").value;
        const threads = document.getElementById("thread_select");
        if (new_sort !== sort) {
          if (localStorage) {
            localStorage.setItem('rifSort', new_sort);
          }
          sort = new_sort;
          var threadList = Array.from(threads.querySelectorAll('option'));
          var oldThread = threads.querySelector("option:checked").getAttribute("value");
          threadList.sort(function(a, b) {
            let conda, condb;
            switch(sort) {
              case "subreddit":
                conda = a.getAttribute("subreddit").toLowerCase();
                condb = b.getAttribute("subreddit").toLowerCase()
                break;
              
              case "votes":
                conda = parseInt(b.getAttribute("votes"));
                condb = parseInt(a.getAttribute("votes"));
                break;
        
              case "comments":
                conda = parseInt(b.getAttribute("comments"));
                condb = parseInt(a.getAttribute("comments"));
                break;
        
              case "newest":
                conda = parseInt(b.getAttribute("created"));
                condb = parseInt(a.getAttribute("created"));
            }
            const namea = a.getAttribute("title").toLowerCase();
            const nameb = b.getAttribute("title").toLowerCase();
            return ((conda < condb) ? -1 : ((conda > condb) ? 1 : ((namea < nameb) ? -1 : 1)));
          });
          while (threads.firstChild) {
            threads.removeChild(threads.lastChild);
          }
          threadList.forEach((item, index) => {
            threads.append(item);
          })
          threads.selectedIndex = 0;
          if (oldThread != threads.querySelector("option:checked").value) {
            threads.onchange();
          }
        }
      };

      redditComments.querySelector("#top_bar").append(sort_select.content);
    }
  }



  redditComments.querySelector("#title").innerHTML = header;
  redditComments.querySelector("#comments").innerHTML = comments;

  redditComments.querySelectorAll("button[type='submit']").forEach(element => element.setAttribute("type", "button"));

  redditComments.addEventListener("click", (event) => {
      let target = event.target;
      if (target.matches("a[data-event-action='delete']")) {
        target.closest("form").querySelector(".error").style.display = "inline";
        target.style.display = "none";
      } else if (target.matches(".del-button a.no")) {
        target.closest("form").querySelectorAll(".option.main, a[data-event-action='delete']").forEach(element => element.style.display = "inline")
        target.parent.style.display = "none";
      } else if (target.matches(".usertext-edit button.cancel")) {
        let entry = target.closest(".comment.thing").querySelector(":scope > .entry");
        entry.querySelector(".usertext-body").style.display = "block";
        entry.querySelectorAll(".usertext-edit, .usertext-buttons button").forEach(element => element.style.display = "none")
      }
  })

  redditComments.querySelectorAll(".drop-choices a.choice").forEach(element => {
    let sort = element.getAttribute("href").match(/\?sort=[a-z]*/);
    element.setAttribute("sort", sort);
    element.setAttribute("href", "javascript:void(0)");
    element.onclick = function() {
      const comments = redditComments.querySelector("#comments");
      while (comments.firstChild) {
        comments.removeChild(comments.lastChild)
      }
      const title = redditComments.querySelector("#title");
      while(title.firstChild) {
        title.removeChild(title.lastChild);
      }
      title.insertAdjacentHTML("beforeend", "<h1>Loading Thread...</h1>");
      setup_comments(redditComments.querySelector("#thread_select option:checked").getAttribute("value"), null, redditComments.querySelector("#thread_select option:checked").getAttribute("time"), this.getAttribute("sort"));
    };
  });

  if (redditComments.querySelector("#nav > select")) {
    const subreddit = redditComments.querySelector("#nav > select option:checked").innerHTML.split(",")[0];
    const sub_link = `<a class="subreddit" href="${'https://www.reddit.com/' + subreddit}">${subreddit}</a>`;
    redditComments.querySelector(".top-matter .tagline .awardings-bar").insertAdjacentHTML("beforebegin", " to " + sub_link);
  }

  if (time) {
    hours = Math.floor(time / 3600);
    let remaining = time % 3600;
    minutes = Math.floor(remaining / 60);
    seconds = remaining % 60;
    let timestamp = "";
    if (hours > 0) {
      timestamp += `${hours}:`
    }
    timestamp += `${minutes}:${("0" + seconds).slice(-2)}`
    redditComments.querySelector("div#title p.title").insertAdjacentHTML("beforeend", `<span> -- </span> <a class="title titleTime" href="javascript:(0)" onclick="document.getElementsByClassName('video-stream')[0].currentTime = ${time}">[${timestamp}]</title>`);
  }

  let threadSelect = redditComments.querySelector("#thread_select");
  if (threadSelect) {
    redditComments.querySelector("#thread_count").textContent = `${threadSelect.length} ${threadSelect.length == 1 ? "Thread" : "Threads"}`;
  }

  collapseHelper();

  chrome.storage.sync.get({collapseOnLoad: "false"}, function(result) {
    if (result.collapseOnLoad == "true") {
      toggle_expand();
    };
    if (loading = document.getElementById("loading_roy")) {
      loading.remove();
    }
    redditComments.style.display = "block";
  });
}

function waitForComments() {
  if (window.location.href !== url && window.location.href.match(/v=/)) {
    const promise = new Promise((resolve, reject) => {
      const intervalId = setInterval(() => {
        if (document.querySelector("#comments, #watch-discussion")) {
          clearInterval(intervalId);
          resolve();
        }
      }, 200);
    });
    promise.then(update());
  }
}

function update() {
  if (window.location.href !== url && window.location.href.match(/v=/)) {
    let comments = document.querySelector("#comments, #watch-discussion");
    if (comments == null) {
      waitForComments();
    } else {
      url = window.location.href;
      // Test the root element of the extension, #reddit_comments, to see if extension has already been appended
      if (document.getElementById("reddit_comments")) {
        // If so, empty out its contents so we can insert new content
        document.getElementById("reddit_comments").remove();
        comments.insertAdjacentHTML("beforebegin", "<h2 id='loading_roy'>Loading Reddit Comments...</h2>");
      } else {
        if (!document.getElementById("loading_roy")) {
          // If extension not loaded yet, and loading text hasn't already been added, add it
          let script = document.createElement("script");
          script.innerHTML = `${click_thing.toString()}
          ${toggle_expand.toString()}
          ${togglecomment.toString()}`
          document.head.append(script);
          comments.insertAdjacentHTML("beforebegin", "<h2 id='loading_roy'>Loading Reddit Comments...</h2>");
        }
      }
      load_extension();
    }
  }
};

document.addEventListener("DOMContentLoaded", (e) => waitForComments());
document.addEventListener("yt-navigate-finish", (e) => waitForComments());
document.addEventListener("spfdone", (e) => waitForComments());