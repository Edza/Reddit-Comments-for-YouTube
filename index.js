var modhash;
var suspended = false;

$(document).click(function(){$(".drop-choices").hide()});

$(function changeSort(){
  $(document).on("click", ".dropdown.lightdrop", function(event) {
    $(this).siblings(".drop-choices").toggle();
    event.stopPropagation();
  });
});

$(function toggleChildComments(){
  $(document).on("click", ".toggleChildren", function(event) {
    $(this).closest(".comment").toggleClass("childrenHidden").addClass("childrenManuallyToggled");
  });
});

$(function moreChildren(){
  $(document).on("click",".morecomments a",function(){
    var clickArgs = $(this).attr("clickArgs").substring('return morechildren('.length, $(this).attr("clickArgs").length - 1).replace(/\'/g, "").split(", ");
    morechildren = $(this).closest(".morechildren");
    $(this).css("color", "red");
    var data = {"link_id": clickArgs[1], "sort": clickArgs[2], "children": clickArgs[3], "id": $(this).attr("id").slice(5, 100), "limit_children": clickArgs[4]};
    chrome.runtime.sendMessage({id: "moreChildren", data: data}, function(response) {
      var children = response.response.jquery[10][3][0];
      var eroot = morechildren.closest(".child, .commentarea");
      morechildren.remove();
      $.each(children, function( index, value ) {
        var htmlDoc = clean_reddit_content($($.parseHTML(decodeHTMLEntities(value.data.content))));
        htmlDoc.children(".child").append(`<div id="siteTable_${value.data.id}" class="sitetable listing"></div>`);
        eroot.find(`#siteTable_${value.data.parent}`).append(htmlDoc);
      });
      collapseHelper();
    });
  });
});

$(function comment(){
  $(document).on("click",".child > form .usertext-buttons .save, .commentarea > form .usertext-buttons .save",function(){
    $textarea = $(this).closest("form.usertext");
    var data = {thing_id: $textarea.find("input[name='thing_id']").attr("value"), text: $textarea.find("textarea").val(), uh: modhash}
    chrome.runtime.sendMessage({id: "comment", data: data}, function (response) {
      if (response.response.success == true) {
        var htmlDoc = clean_reddit_content($($.parseHTML(decodeHTMLEntities(response.response.jquery[response.response.jquery.length-4][3][0][0].data.content))));
        $textarea.closest(".comment").removeClass("childrenHidden").addClass("childrenManuallyToggled");
        $textarea.parent().children(".sitetable").prepend(htmlDoc);
        $textarea.find("span.status").text("");
        if ($textarea.hasClass("removable")) {
          $textarea.remove();
        } else {
          $textarea.find("textarea").val("");
        }
      } else {
        $textarea.find("span.status").text(response.response.jquery[response.response.jquery.length-3][3][0]);
      }
      collapseHelper();
    });
  });
});

$(function edit() {
  $(document).on("click",".edit-usertext",function(){
    var parent = $(this).closest(".thing.comment");
    parent.children(".entry").find(".usertext-body").hide();
    parent.children(".entry").find(".usertext-edit, .usertext-buttons button").show();
    parent.children(".entry").find(".usertext-edit button.save").click(function() {
      var data = {thing_id: parent.attr("data-fullname"), text: parent.find(".usertext-edit textarea").val(), uh: modhash};
      chrome.runtime.sendMessage({id: "edit", data: data}, function (response) {
        if (response.response.success == true) {
          var htmlDoc = clean_reddit_content($($.parseHTML(decodeHTMLEntities(response.response.jquery[response.response.jquery.length-4][3][0][0].data.content))));
          parent.children(".entry").replaceWith(htmlDoc.find(".entry"));
        } else {
          parent.children(".entry").find("span.status").text(response.response.jquery[response.response.jquery.length-3][3][0]);
        }
      });
    });
  })
})

$(function reply() {
  $(document).on("click",".reply-button a",function(){
    var parentComment = $(this).closest(".thing.comment");
    parentComment.children(".child").prepend(`
      <form action='#' class='usertext cloneable removable'>
      <input type='hidden' name='thing_id' value='${parentComment.attr("data-fullname")}'>
          <div class='usertext-edit md-container' style='width: 500px;'>
              <div class='md'>
                <textarea class='replybox'></textarea>
              </div>
              <div class='bottom-area'>
                  <div class='usertext-buttons'>
                      <button type='button' onclick='' class='save'>save</button>
                      <button type='button' onclick='$(this).closest("form").remove()' class='cancel' style=''>cancel</button>
                      <span class='status'></span>
                  </div>
              </div>
          </div>
      </form>
    `);
    parentComment.children(".child").find("textarea.replybox").focus();
    if (!parentComment.children(".child").children(".sitetable").length) {
      parentComment.children(".child").append(`<div id="siteTable_${parentComment.attr("data-fullname")}" class="sitetable listing">`);
    }
  });
})

$(function deleteComment() {
  $(document).on("click",".del-button a.yes",function(){
    chrome.runtime.sendMessage({id: "delete", data: {id: $(this).closest(".thing.comment").attr("data-fullname"), uh: modhash}});
    $(this).closest("form").html("<span style='padding-right: 5px'>deleted</span>");
  });
})

$(function vote(){
  $(document).on("click",".arrow",function() {
    $parent = $(this).parent().parent();
    var direction;
    if ($(this).hasClass("up")) {
      direction = 1;
      $(this).removeClass("up").addClass("upmod");
      $(this).parent().find(".downmod").removeClass("down").addClass("down");
      $parent.children(".unvoted").removeClass("unvoted").addClass("likes");
      $parent.children(".dislikes").removeClass("dislikes").addClass("likes");
    } else if ($(this).hasClass("down")) {
      direction = -1;
      $(this).removeClass("down").addClass("downmod");
      $(this).parent().find(".upmod").removeClass("upmod").addClass("up");
      $parent.children(".unvoted").removeClass("unvoted").addClass("dislikes");
      $parent.children(".likes").removeClass("likes").addClass("dislikes");
    } else {
      direction = 0;
      $(this).parent().find(".downmod").removeClass("downmod").addClass("down");
      $(this).parent().find(".upmod").removeClass("upmod").addClass("up");
      $parent.children(".dislikes").removeClass("dislikes").addClass("unvoted");
      $parent.children(".likes").removeClass("likes").addClass("unvoted");
    }
    var data = {dir: direction, id: $parent.attr("data-fullname"), rank: 2, uh: modhash};
    chrome.runtime.sendMessage({id: "vote", data: data});
  });
});

function collapseHelper() {
  $("#reddit_comments .comment").has(".child .sitetable").addClass("hasChild");
  chrome.storage.sync.get({childrenHiddenDefault: "false"}, function(result) {
    if (result.childrenHiddenDefault == "true") {
      $("#reddit_comments .commentarea > .sitetable").children(":not(.childrenManuallyToggled)").addClass("childrenHidden");
    };
  });
}

function display_error_message() {
  if (!navigator.onLine) {
    append_extension(false, "<h3 id='nothread'>Internet connection error. Please check your connection and reload the page.</h3>", "");
    $("#reddit_comments > #nav").attr("display", "none");
  } else {
    append_extension(false, "<h3 id='nothread'>Unknown error loading Reddit content. It is possible that Reddit is down or something in the extension went wrong.</h3>", "");
    $("#reddit_comments > #nav").attr("display", "none");
  }
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
    const conda = sort === "subreddit" ? a.data.subreddit.toLowerCase() : sort === "votes" ? b.data.score : b.data.num_comments;
    const condb = sort === "subreddit" ? b.data.subreddit.toLowerCase() : sort === "votes" ? a.data.score : a.data.num_comments;
    const namea = a.data.name.toLowerCase();
    const nameb = b.data.name.toLowerCase();
    return ((conda < condb) ? -1 : ((conda > condb) ? 1 : ((namea < nameb) ? -1 : 1)));
  });
}

function get_threads(v, callback) {
  const baseUrl = 'https://old.reddit.com/api/info.json?limit=100&url=';
  const requests = [
    'https://www.youtube.com/watch?v=',
    'http://www.youtube.com/watch?v=',
    'https://m.youtube.com/watch?v=',
    'http://m.youtube.com/watch?v=',
    'https://youtu.be/',
    'http://youtu.be/',
	  'https://invidio.us/'
  ].map(url => `${baseUrl}${url}${v}`);

  requests.push(`https://old.reddit.com/search.json?limit=100&q=url:${v}&feature`)
  requests.push(`https://old.reddit.com/search.json?limit=100&q=url:${v}&t`)
  requests.push(`https://old.reddit.com/search.json?limit=100&q=url:${v}&ab_channel`)

  chrome.runtime.sendMessage({id: "getThreads", urls: requests}, function(response) {
    setup_threads(response.response)
  });
}

function setup_threads(threads) {
  var filtered = threads.filter(t => !t.data.promoted).filter(t => (t.data.domain == "youtube.com" || t.data.domain == "youtu.be" || t.data.domain == "m.youtube.com" || t.data.domain == "invidio.us"));
  chrome.storage.sync.get({subBlacklist: []}, function(result) {
    filtered = filtered.filter(t => !result.subBlacklist.includes(t.data.subreddit.toLowerCase()));
  });
  chrome.runtime.sendMessage({id: "getMe"}, function(meResponse) {
    modhash = meResponse.response.data.modhash;
    if (meResponse.response.data.is_suspended) {
      suspended = meResponse.response.data.is_suspended;
    }
    if (typeof meResponse.response.data.over_18 == "undefined" || !meResponse.response.data.over_18) {
      filtered = filtered.filter(t => !t.data.over_18);
    }
    if (filtered.length) {
      let sorted_threads = sort_threads(filtered);
  
      // Filter duplicates:
      var unique_threads = [];
      for(let i = 0; i < sorted_threads.length; i++) {
        if (!isDupe(sorted_threads[i], unique_threads)) {
          unique_threads.push(sorted_threads[i]);
        }
      }
  
      sorted_threads = unique_threads;
  
      let $thread_select = $("<select id='thread_select'></select>");
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
  
        let time = t.url.match(/(\#|\?|\&)t\=\d+(m\d+s)?/);
        if (time) {
          time = time[0].slice(3);
          if (!isNaN(time)) {
            time = `${parseInt(parseInt(time) / 60)}m${parseInt(time) % 60}s`;
          }
        } else {
          time = "";
        }
  
        if (i === 0) {
          starterTime = time;
        }
  
        const $opt = `<option
          value="${t.permalink}"
          title="${t.title.replace(/\"/g,'&quot;')}"
          time="${time}"
          subreddit="${t.subreddit}"
          votes=${t.score}
          comments=${t.num_comments}
          >${forward}${spaces} ${sliced_title}</option>`;
  
        $thread_select.append($opt);
      });
  
      $thread_select.on('change', function(event) {
        $("#reddit_comments > #comments").empty();
        $("#reddit_comments > #title").empty().html("<h1>Loading Thread...</h1>");
        setup_comments(event.target.value, null, $($("option:selected", this)[0]).attr("time"));
      });
      setup_comments(sorted_threads[0].data.permalink, $thread_select, starterTime);
    } else {
      append_extension(false, "<h3 id='nothread'>No Threads Found</h3>", "");
      $("#reddit_comments > #nav").remove();
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
    get_threads(video, setup_threads);
  }
}

function clean_reddit_content($content) {
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
  $content.find(removables).remove();
  $content.find(".access-required.archived").css("visibility", "hidden");
  $content.find("button").attr("type", "button");
  $content.find(".morecomments a").attr("clickArgs", function() { return $(this).attr("onclick")}).removeAttr("onclick");
  $content.find("a[data-event-action='delete'], .del-button a, .edit-usertext, .usertext-edit button, .dropdown.lightdrop").removeAttr("onclick");
  $content.find("a[href='#']").attr("href", "javascript:void(0)");
  $content.find("a[href='#s'], a[href='/s']").attr("href", "javascript:void(0)").addClass("reddit_spoiler");
  $content.find("a[href^='/']").attr("href", function() {return "https://www.reddit.com" + $(this).attr("href")});
  $content.find("ul.flat-list.buttons").append("<li><a href='javascript:void(0)' class='toggleChildren'></a></li>");
  $content.find("a.author, a[data-event-action='permalink']").each(function() {
    $(this).attr("href", $(this).attr("href").replace("old.reddit.com", "www.reddit.com"));
  });
  if (suspended) {
    $content.find(".access-required, .commentarea > .usertext").remove();
  }
  return $content;
}

function setup_comments(permalink, $thread_select, time, sort = "") {
  chrome.runtime.sendMessage({id: "setupComments", permalink: permalink, sort: sort}, function(response) {
    if (response.response != null) {
      var $page = $(response.response);
      // Make thread title link go to actual thread:
      $page.find("a.title").attr("href", "https://www.reddit.com" + permalink);
      $page = clean_reddit_content($page);

      const header_html = $page.find("#siteTable .link")[0].outerHTML;
      const comment_html = $page.find(".commentarea")[0].outerHTML;

      append_extension($thread_select, header_html, comment_html, time);
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
function toggle_expand(elem) {
  document.querySelector("#reddit_comments > #nav").classList.toggle("reddit_hidden");
  document.querySelector("#reddit_comments > #title").classList.toggle("reddit_hidden");
  document.querySelector("#reddit_comments > #comments").classList.toggle("reddit_hidden");

  if (elem.innerHTML[1] === "-") {
    elem.innerHTML = "[+]";
  } else {
    elem.innerHTML = "[-]";
  }
}

function togglecomment(e) {
  var t=e.parentElement.parentElement.parentElement;
  var r=t.classList.contains("collapsed");
  t.classList.toggle("collapsed");
  t.classList.toggle("noncollapsed");
  e.innerHTML = (r?"[–]":"[+]")
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


function append_extension($thread_select, $header, $comments, time) {
  // If extension not already appended, append it:
  if (!$("#reddit_comments").length) {
    $("#loading_roy").remove();
    $("#comments").before("<div id='reddit_comments'></div>");
    $("#reddit_comments").append("<div id='top_bar'></div>");
    $("#reddit_comments").append("<div id='nav'></div>");
    $("#reddit_comments").append("<div id='title'></div>");
    $("#reddit_comments").append("<div id='comments'></div>");
    const expander = `<h2><a id="expand" href="javascript:void(0)" onclick="return toggle_expand(this)">[-]</a> Reddit Comments</h2>`;
    $("#reddit_comments > #top_bar").append(expander + "<h2></h2>");
    // Append a short script to the page that so that clicks can be handled:
    $("#reddit_comments").append(`<script src="https://code.jquery.com/jquery-3.4.1.min.js"></script> `);
    $("#reddit_comments").append(`<script>${click_thing.toString() + toggle_expand.toString() + togglecomment.toString()}</script>`);
  }

  // If passed a new thread dropdown, replace the old one
  if ($thread_select) {
    $("#reddit_comments > #nav").empty().append($thread_select);

    if (!$("#mySortSelect").length) {
      let $sort_select = $(`
        <div id="mySortSelect">
          <h2>Sort By:&nbsp;</h2>
          <select>
            <option value="votes" title="Score" ${sort === "votes" ? "selected" : ""}>Score</option>
            <option value="comments" title="Comments" ${sort === "comments" ? "selected" : ""}>Comments</option>
            <option value="subreddit" title="Subreddit" ${sort === "subreddit" ? "selected" : ""}>Subreddit</option>
          </select>
        </div>
      `);

      $sort_select.on("change", function(event) {
        const new_sort = event.target.value;
        if (new_sort !== sort) {
          if (localStorage) {
            localStorage.setItem('rifSort', new_sort);
          }
          sort = new_sort;
          var threadList = $('#thread_select option');
          var oldThread = $thread_select.find(":selected").attr("value");
          threadList.sort(function(a, b) {
            const conda = sort === "subreddit" ? $(a).attr("subreddit").toLowerCase() : sort === "votes" ? parseInt($(b).attr("votes")) : parseInt($(b).attr("comments"));
            const condb = sort === "subreddit" ? $(b).attr("subreddit").toLowerCase() : sort === "votes" ? parseInt($(a).attr("votes")) : parseInt($(a).attr("comments"));
            const namea = $(a).attr("title").toLowerCase();
            const nameb = $(b).attr("title").toLowerCase();
            return ((conda < condb) ? -1 : ((conda > condb) ? 1 : ((namea < nameb) ? -1 : 1)));
          });
          $thread_select.html(threadList).prop("selectedIndex", 0);
          if (oldThread != $thread_select.find(":selected").attr("value")) {
            $thread_select.change();
          }
        }
      });

      $("#reddit_comments > #top_bar").append($sort_select);
    }
  }



  $("#reddit_comments > #title").empty().append($header);
  $("#reddit_comments > #comments").empty().append($comments);

  $("#reddit_comments").find("button[type='submit']").attr("type", "button");

  $("#reddit_comments").on("click", "a[data-event-action='delete']", function() {
    $(this).closest("form").find(".error").show();
    $(this).hide();
  });

  $("#reddit_comments").on("click", ".del-button a.no", function() {
    $(this).closest("form").find(".option.main, a[data-event-action='delete']").show();
    $(this).parent().hide();
  });

  $("#reddit_comments").on("click", ".usertext-edit button.cancel", function() {
    $(this).closest(".comment.thing").children(".entry").find(".usertext-body").show();
    $(this).closest(".comment.thing").children(".entry").find(".usertext-edit, .usertext-buttons button").hide();
  });

  $("#reddit_comments").find(".drop-choices a.choice").each(function() {
    var sort = $(this).attr("href").match(/(?<=\?sort=)[a-z]*/);
    $(this).attr("sort", sort);
    $(this).attr("href", "javascript:void(0)");
    $(this).click(function() {
      $("#reddit_comments > #comments").empty();
        $("#reddit_comments > #title").empty().html("<h1>Loading Thread...</h1>");
        setup_comments($("#thread_select").find(":selected").attr("value"), null, $($("option:selected", this)[0]).attr("time"), $(this).attr("sort"));
    })
  });

  if ($("#reddit_comments > #nav > select").length) {
    const subreddit = $("#reddit_comments > #nav > select").find(":selected")[0].innerHTML.split(",")[0];
    const sub_link = `<a class="author" href="${'https://www.reddit.com/' + subreddit}">${subreddit}</a>`;
    $("#reddit_comments > #title > .tagline").append(" to " + sub_link);
  }

  if (time) {
    $("div#title > p.title").append(`<a class="title titleTime" href="${window.location.href + '&t=' + time}">[${time}]</title>`);
  }

  collapseHelper();
}

// YouTube doesn't reload pages in a normal manner when you click on a new video,
// making knowing when a user has gone to a new video difficult. None of the provided
// event listeners handle all cases, so the best way I found to always be sure the
// right thread is loaded is to just add a scroll listener that tests if the url is
// different, and if so, then reload the extension. This will always work because users
// always have to scroll to get to the comments.
window.addEventListener("scroll", function(e) {
  if (window.location.href !== url && window.location.href.match(/v=/)) {
    url = window.location.href;
    // Test the root element of the extension, #reddit_comments, to see if extension has already been appended
    if ($("#reddit_comments").length) {
      // If so, empty out its contents so we can insert new content
      $("#reddit_comments").remove();
	  $("#comments").before("<h2 id='loading_roy'>Loading Reddit Comments...</h2>");
    } else {
      if (!$("#loading_roy").length) {
        // If extension not loaded yet, and loading text hasn't already been added, add it
        $("#comments").before("<h2 id='loading_roy'>Loading Reddit Comments...</h2>");
      }
    }
    load_extension();
  }
});
