# Reddit Comments for YouTube

![Screenshot of comments](https://files.catbox.moe/m6oxwy.png)

An extension to display Reddit threads for YouTube videos.

This is a fork of [Lucien Maloney's extension](https://github.com/lucienmaloney/reddit_comments_for_youtube_extension).

Supports:

- Displaying threads
- Blacklisting subreddits
- Voting
- Commenting

#### Querying

In order to retrieve as many results as possible, multiple requests must be sent to the Reddit API. This is because there are multiple ways to link to the same video. Depending on how the video was shared, the URL could contain one of many domains (youtube.com, youtu.be, m.youtube.com, invidio.us), so these all must be accounted for. Even though the 8 following URLs all point to the same video, they are all different and Reddit's internal search functions will treat them as such, meaning they each require their own request:

- https://www.youtube.com/watch?v=dQw4w9WgXcQ
- https://youtu.be/dQw4w9WgXcQ
- https://m.youtube.com/watch?v=dQw4w9WgXcQ
- https://invidio.us/watch?v=dQw4w9WgXcQ

The `/api/search` endpoint is used to make these requests. Each request will retrieve up to 100 results, and if additional pages are provided with an `after` response, those will be queried as well. Reddit provides a maximum of 10 pages per query, meaning up to 1000 results can be retrieved for each domain.

#### Displaying

After all the threads are retrieved and sorted by score, comments, or subreddit, the top thread is rendered. This occurs by requesting the the top thread's page from old.reddit.com and doing some filtering and formatting to the content to make it work inside of the YouTube page.

#### Interacting

When the thread is requested, the extension will usually keep most interactive elements. Each of these elements has a listener and, when clicked, will send a request to the relevant Reddit API endpoint. This doesn't use Reddit's code, but mimics it for almost identical functionality.

Interactive elements will be stripped if:

- The extension cannot access Reddit cookies
- The user is logged out
- The user is suspended
- The thread is archived
- The thread or comment chain is locked