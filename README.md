# Reddit Comments for YouTube

An extension to display Reddit threads for YouTube videos.

Supports:

- Displaying threads
- Blacklisting subreddits
- Voting
- Commenting

#### Querying

In order to ensure as many results as possible, multiple requests must be sent to the Reddit API. This is because there are multiple ways to link to the same video. Depending on how the video was shared, the URL could contain multiple domains (youtube.com, youtu.be, m.youtube.com, or YouTube proxy invidio.us), as well as timestamps and adblock whitelist arguments, so many variations must be accounted for. Also, a URL could be linked either via HTTP or HTTPS. What this means is that even though the 8 following URLs all point to the same video, they are all technically different, and Reddit's internal search functions treat them differently, meaning they each require their own request:

- https://www.youtube.com/watch?v=dQw4w9WgXcQ
- http://www.youtube.com/watch?v=dQw4w9WgXcQ
- https://youtu.be/dQw4w9WgXcQ
- http://youtu.be/dQw4w9WgXcQ
- https://m.youtube.com/watch?v=dQw4w9WgXcQ
- http://m.youtube.com/watch?v=dQw4w9WgXcQ
- https://invidio.us/watch?v=dQw4w9WgXcQ
- http://invidio.us/watch?v=dQw4w9WgXcQ

If only people were more consistent in how they linked YouTube videos, but alas...

Another consideration is that the Reddit API only allows for a maximum of 100 results per request, so we only have a theoretical maximum of 800 threads returned with our 8 requests (although it's unlikely that m.youtube.com and invidio.us, as well as all of the HTTP requests will ever come close to their 100 limit). This isn't an issue for the majority of videos, but for widely shared videos (like dQw4w9WgXcQ) there will be threads cut off. Unfortunately, the `/api/info` endpoint we are using for requesting threads doesn't support the `after` argument, so there isn't any way to get past the first 100 arbitrarily selected threads.

Additionally, more requests are made to the `/api/search` endpoint with requests such as:

- dQw4w9WgXcQ%26t=5
- dQw4w9WgXcQ%26feature=youtu.be
- dQw4w9WgXcQ%26ab_channel=RickAstleyVEVO

These are done to find videos linked with timestamps and other arguments. `/api/search` is used instead of `/api/info` because `/api/info` only accepts exact URLs, and it is not worth tripling the number of requests for what would usually account for a sub-100 number of results across domains.

#### Displaying

After all the threads are retrieved and sorted by either score, comments, or subreddit, the top thread is rendered. This occurs by requesting the the top thread's page from old.reddit.com, and doing some filtering and formatting to the content to make it work inside of the YouTube page.

#### Interacting

When the thread request, the extension will usually keep most interactive elements. Each of the elements has a listener and when clicked will send a request to the relevant Reddit API endpoint. This doesn't use Reddit's built-in code, but mimics it for almost identical results.

Interactive elements will be stripped if:

- The extension cannot access Reddit cookies
- The user is logged out
- The user is suspended
- The thread is archived
- The thread or comment chain is locked
