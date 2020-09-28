var subredditPattern = new RegExp("^[a-zA-Z0-9_]+$");

document.addEventListener("DOMContentLoaded", event => {
    chrome.storage.sync.get({childrenHiddenDefault: "false"}, function(result) {
        if (result.childrenHiddenDefault == "true") {
          document.querySelector("#collapseOption").checked = true;
        };
      });
    document.querySelector('#collapseOption').onchange = function() {
        if (this.checked) {
            chrome.storage.sync.set({childrenHiddenDefault: "true"});
        }
        else {
            chrome.storage.sync.set({childrenHiddenDefault: "false"});
        }
    };

    chrome.storage.sync.get({collapseOnLoad: "false"}, function(result) {
        if (result.collapseOnLoad == "true") {
            document.querySelector("#rememberToggleOption").checked = true;
        };
      });
      document.querySelector('#rememberToggleOption').onchange = function(){
            if (this.checked) {
                chrome.storage.sync.set({collapseOnLoad: "true"});
            }
            else {
                chrome.storage.sync.set({collapseOnLoad: "false"});
            }
    };

    chrome.storage.sync.get({subBlacklist: []}, function(result) {
        result.subBlacklist.forEach(element => {
            document.querySelector("#blacklist").insertAdjacentHTML("beforeend", "<p class='subEntry'><span class='remove'>&#10006; </span><span class='name'>" + element + "</span></p>");
        });
    });
})

document.addEventListener("click", event => {
    let target = event.target;
    if (target.classList.contains("remove")) {
        parent = target.parentElement;
        let sub = parent.querySelector(".name").textContent;
        chrome.storage.sync.get({subBlacklist: []}, function(result) {
            var subBlacklist = result.subBlacklist.filter(word => word != sub);
            chrome.storage.sync.set({subBlacklist: subBlacklist}, function() {
                parent.remove();
            });
        });
    } else if (target.id == "clearButton") {
        document.getElementById("duplicateError").style.display = "none";
        chrome.storage.sync.remove("subBlacklist", function() {
            let blacklist = document.getElementById("blacklist");
            while (blacklist.firstChild) {
                blacklist.removeChild(blacklist.lastChild);
            }
        });
    } else if (target.id == "blacklistButton") {
        document.getElementById("duplicateError").style.display = "none";
        sub = document.getElementById('blacklistInput').value.toLowerCase();
        if (subredditPattern.test(sub)) {
            document.getElementById("inputError").style.display = "none";
            chrome.storage.sync.get({subBlacklist: []}, function(result) {
                var subBlacklist = result.subBlacklist;
                if (subBlacklist.includes(sub.toLowerCase())) {
                    document.getElementById("duplicateError").style.display = "block";
                } else {
                    subBlacklist.push(sub);
                    chrome.storage.sync.set({subBlacklist: subBlacklist}, function() {
                        document.getElementById("blacklist").insertAdjacentHTML("beforeend", "<p class='subEntry'><span class='remove'>&#10006; </span><span class='name'>" + sub + "</span></p>");
                        document.getElementById("blacklistInput").value = "";
                    });
                }
            });
        } else {
            document.getElementById("#inputError").show();
        }
    }
})