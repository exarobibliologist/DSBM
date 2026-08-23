# (DSBM) DeviantArt Super Badge Manager

## First, A Sincere Thank You...

This script thanks the users who designed the original Greasemonkey scripts:

* [One Click Llama Button](https://www.deviantart.com/kishan-bagaria/art/One-Click-Llama-Button-450957519)
* [One Click Cake Button](https://www.deviantart.com/liamb135/art/One-Click-Cake-Button-1233911870)
* [One-Click Llama Button Helper](https://www.deviantart.com/hampshirebrony/art/One-Click-Llama-Button-Helper-v0-20-757494192)

Without your original work, this script would never have been designed.

As a sincere thank you for the amazing work that preceded this script, I am hosting the original scripts inside this GitHub repository as well. Look in the **Saved Scripts** folder. I wanted to host the original scripts as well as the script I designed, so that these original scripts will always remain available even if the original websites should experience difficulties in the future.

Thank you for your work in designing the original llama and cake scripts!

# Meet the New DSBM

**(DSBM) DeviantArt Super Badge Manager** is a JavaScript userscript designed to run through **Greasemonkey, Tampermonkey, or Violentmonkey**.

It combines Llama and Cake management into a single script, automatically checking badge eligibility and adding convenient controls directly beside usernames throughout DeviantArt.

Instead of manually opening individual profiles and hunting around for badge controls, DSBM adds small status indicators next to usernames and provides a floating **Super Badge Queue** for sending available badges across the currently loaded page.

The script also incorporates its own caching, request throttling, queue management, error handling, and dynamic page scanning so that it can operate without constantly hammering DeviantArt's servers.

# Core Features

### 🦙 Llama and Cake Management

DSBM manages **BOTH Llamas AND Cakes** from the same interface.

For each detected username, the script can display whether:

* A Llama can be given.
* A Llama has already been given.
* A Cake can be given.
* A Cake has already been given.
* The recipient has reached the Cake limit.
* The status is currently unknown.
* The previous attempt encountered an error.
* DeviantArt's spam protection has temporarily intervened.

Clicking an available badge allows you to queue that badge for the individual user.

### 🚀 Mass-Sending Queue

The floating **Super Badge Queue** provides a one-click way to send available badges to users detected on the current page.

The queue:

* Detects available Llamas and Cakes.
* Removes duplicate users from the mass-send operation.
* Prevents duplicate requests for the same user and badge type.
* Processes requests sequentially rather than firing hundreds of requests simultaneously.
* Automatically updates the interface as requests are processed.

The mass-send operation applies to users currently detected on the page. It does **not** attempt to crawl the entire DeviantArt website.

### 🎛️ Compact Floating Control Panel

The Super Badge Queue panel normally sits quietly in the bottom-right corner of the screen.

Hover over it to expand the panel and reveal:

* Pending requests.
* Successfully sent badges.
* Spam-filter hits.
* Errors.
* The **Mass Send Available Badges** button.

When not being used, the panel collapses into a small floating icon rather than permanently occupying a large portion of the screen.

### 👤 Inline Username Widgets

DSBM automatically adds Llama and Cake indicators beside usernames throughout DeviantArt.

The widgets provide immediate visual feedback about each user's badge status without requiring you to open their profile.

The script also avoids adding widgets to your own username.

### 🔄 Dynamic Page Scanning

DSBM uses a **MutationObserver** to monitor the page for newly inserted usernames.

This means it can detect users appearing after the initial page load, including content loaded dynamically as you browse.

You do not need to manually reload the page every time DeviantArt adds more content.

Each scan processes up to **50 usernames at a time** to help keep large pages manageable.

### 💾 Local Status Cache

DSBM maintains a local cache of badge status information.

Cached status information can remain available for up to **30 days**, reducing the need to repeatedly ask DeviantArt for the same information.

The cache is stored in your browser's `localStorage` and is also maintained in an in-memory cache while the script is running.

The script does **not** permanently cache a Cake as having been given simply because DSBM sent one.

### 🍰 Session-Based Cake Protection

Cakes receive special handling because DeviantArt's Cake system allows repeated giving up to its applicable limit.

Once DSBM successfully gives a Cake to someone during the current page session, that user is temporarily marked as having received a Cake.

This prevents the same person from accidentally being queued for another Cake during that session.

This session state is deliberately **not written as a permanent "Cake already given" record to local storage**.

### 🧠 CSRF Token Caching

DSBM obtains DeviantArt's CSRF token when needed and caches it for **30 minutes**.

If the token is not immediately available in the page, the script attempts to retrieve it from DeviantArt directly.

This avoids repeatedly performing the same token lookup for every badge operation.

### 🛑 Anti-Spam Throttling

DSBM deliberately spaces automated badge requests using randomized delays of approximately **2.5 to 4 seconds**.

If DeviantArt responds with an indication that requests are being made too quickly or that its spam filter has been triggered, DSBM:

1. Records the spam-filter event.
2. Changes the affected badge indicator to the spam state.
3. Pauses processing for **60 seconds**.
4. Automatically retries the request.

In other words, when DeviantArt says "slow down," DSBM actually listens.

### 🧯 Error Handling and Recovery

DSBM includes several layers of error handling.

Network failures are detected and displayed as errors rather than being silently ignored.

The script also accounts for cases where DeviantArt rejects a request without returning the response one might reasonably expect.

For example, if DeviantArt effectively responds with an "already has one" or "cannot give badge" condition, DSBM attempts to interpret that response and update its cached status instead of blindly treating the operation as a catastrophic failure.

### 🔁 Retryable Error States

Badge indicators that enter certain error or spam states remain interactive.

This allows you to attempt the operation again rather than having to reload the entire page just because one request failed.

### 📊 Live Statistics

The floating panel keeps track of the current queue:

| Statistic     | Meaning                                                                              |
| ------------- | ------------------------------------------------------------------------------------ |
| **Pending**   | Badge operations waiting to be processed                                             |
| **Sent**      | Badge operations successfully completed or determined to have already been satisfied |
| **Spam Hits** | Requests rejected because DeviantArt's anti-spam protections were triggered          |
| **Errors**    | Requests that failed for other reasons                                               |

The statistics update while the queue is running.

### 🖼️ Self-Contained Badge Graphics

The script includes its badge graphics directly inside the JavaScript file as embedded Base64 image data.

This means the script does not need to download separate image files just to display its interface.

The interface includes separate visual states for:

* Give Llama
* Llama successfully sent
* Llama already given
* Llama limit reached
* Llama error
* Give Cake
* Cake successfully sent
* Cake already given
* Cake limit reached
* Unknown status
* Spam-filter warning

# How It Works

At a high level, DSBM follows this process:

1. Detect usernames on the current DeviantArt page.
2. Ignore your own username and usernames that have already been processed.
3. Add Llama and Cake controls beside each detected username.
4. Check the local cache for previously retrieved badge information.
5. If the status is not cached, request the current status from DeviantArt.
6. Display the appropriate badge indicator.
7. When you click a badge, add it to the processing queue.
8. When you use **Mass Send Available Badges**, automatically queue all currently available badges detected on the page.
9. Process the queue one request at a time.
10. Wait between requests to reduce the likelihood of triggering anti-spam protections.
11. Update the interface and cached information after each operation.

The result is a single userscript that combines the functionality of the older Llama/Cake scripts with a considerably more automated queue and status-management system.

# Installation Instructions

### Install a Userscript Manager

First, install a browser extension such as:

* [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
* [Tampermonkey](https://www.tampermonkey.net/)
* [Violentmonkey](https://violentmonkey.github.io/)

### Add the Script

Click *(https://github.com/exarobibliologist/DSBM/blob/main/DSBM.user.js)* then click the "Raw" button in the upper-right hand corner of the script pane...

or manually create a new userscript in your userscript manager and paste the contents of `DSBM.user.js`.

### Save and Enable

Save the script in your userscript manager and make sure it is enabled.

### Navigate to DeviantArt

Open or refresh a DeviantArt page.

After the script initializes, DSBM will begin detecting usernames and adding its badge widgets.

### Click to Send or Mass-Send

Click an individual Llama or Cake indicator beside a username to queue a badge for that user.

Alternatively, hover over the **Super Badge Queue** in the bottom-right corner and click:

**Mass Send Available Badges**

DSBM will queue the available Llamas and Cakes currently detected on the page and process them automatically.

# Important Notes

### The Cache Is Local

Badge status information is stored in your browser's `localStorage`.

Clearing your browser's site data or local storage may therefore cause DSBM to forget previously cached badge statuses and request them again.

### Cakes Are Session-Aware

Cake deliveries are tracked separately for the current page session.

This is intentional.

A Cake successfully given by DSBM is temporarily blocked from being sent to the same user again and again during the same session, but the script does not permanently record that Cake as having been given in its local cache, so you can send the user another cake later in a different session.

### DeviantArt Can Change

DSBM communicates directly with DeviantArt's internal endpoints.

If DeviantArt changes its website, API endpoints, page structure, authentication system, CSRF handling, badge system, anti-spam behavior, or anything else the script depends upon, DSBM may stop working correctly.

This is unfortunately one of the unavoidable hazards of writing software that depends on a website you do not control.

# DISCLAIMER

## **Use this script at your own risk.**

This Greasemonkey/Tampermonkey/Violentmonkey userscript is provided **"as is"**, without any guarantee that it will continue to function correctly as the websites it interacts with are updated, redesigned, modified, deprecated, or otherwise decide to become difficult for no particular reason.

Because this script runs in your browser and interacts with third-party websites, **I am not responsible for unexpected website behavior, broken pages, missing features, incorrect displays, error messages, excessive notifications, or other forms of digital weirdness** that may occur while the script is enabled.

I am also not responsible for:

* Websites suddenly deciding that the script's behavior looks suspicious.
* Spam detection, bot detection, anti-abuse systems, rate limiting, CAPTCHA challenges, or other automated security systems going completely bananas.
* Your account being temporarily restricted, flagged, challenged, rate-limited, suspended, or otherwise inconvenienced by a third-party website.
* Conflicts between this script and other Greasemonkey, Tampermonkey, Violentmonkey, or other userscripts.
* Conflicts with browser extensions or custom browser modifications.
* Changes made to the website after this script was released that cause the script to malfunction.
* The website behaving differently depending on your browser, browser version, extensions, account settings, region, or other environmental factors.
* Data being displayed incorrectly, actions failing to occur, or the website doing something spectacularly unexpected because of a conflict or incompatibility.
* Any consequences resulting from using, modifying, or attempting to modify this script.

**In short:** if enabling this script causes a website to spontaneously develop opinions, I probably did not personally cause it, and I cannot be held responsible for it.

## Bug Reports and Support

If you encounter a problem that appears to be caused by this script, **please file a bug report on this project's GitHub repository** by [clicking here](link here) rather than contacting me directly for user support.

When reporting a bug, please include:

* The version of the script you are using.
* The browser and version you are using.
* Your Greasemonkey/Tampermonkey/Violentmonkey version.
* The affected website and, if applicable, the specific page or feature.
* Any relevant error messages.
* A description of what you expected to happen vs. what actually happened.
* A list of all the other userscripts or browser extensions that may be interacting with the affected page.

Bug reports submitted through GitHub are much easier for me to track, reproduce, investigate, and address than private messages, comments, or "hey, it doesn't work" messages sent through various corners of the internet.

**Please do not use direct messages as a substitute for a bug report.** If the problem is worth fixing, it is worth documenting where it can actually be tracked.

Finally, remember that this script is **not affiliated with DeviantArt, endorsed by DeviantArt, or directly supported by DeviantArt** unless explicitly stated otherwise.

# AI DISCLAIMER

I am absolute shit at JavaScript, as I discovered while working on this.

Not everything in this script was designed by AI. Most of it was designed by hand, but then bug-tested by AI, which very harshly tore my code to pieces and suggested new ways of doing things.

All of the actual ideas were brainstormed by me, a human, during a long conversation I had with an AI about how to design things like this, with the AI taking the back seat on actual design while asking leading questions such as:

> "Have you thought about how to approach this potential problem?"

Or posing multiple-choice questions like:

> "You could solve this problem using Option A, Option B, or Option C. Are you going to use one of those methods, or do you have another idea for this module?"

After I had designed most of the code by hand, I offered it as a sacrifice to the AI, which tore it to pieces and very politely reminded me that my code was shit, while saying things like:

> "I think what you were trying to do here was..."

We then had many more conversations about my intentions behind the code I had written.

In certain areas, the AI offered explanations about why my code wouldn't work and suggested approaches that helped me revise and improve it.

So, in the way I used the AI, it was more like a **JavaScript professor** helping me learn and refine my programming skills than an AI that simply generated the entire project for me.

All-in-all, I would say that the code is **100% a human invention**, but give the AI **50% credit for the professorial help** it provided while I was revising, debugging, and learning.

# Credits

This project would not exist without the earlier DeviantArt badge scripts that inspired it.

Special thanks to the creators of:

* [One Click Llama Button](https://www.deviantart.com/kishan-bagaria/art/One-Click-Llama-Button-450957519)
* [One Click Cake Button](https://www.deviantart.com/liamb135/art/One-Click-Cake-Button-1233911870)
* [One-Click Llama Button Helper](https://www.deviantart.com/hampshirebrony/art/One-Click-Llama-Button-Helper-v0-20-757494192)

DSBM is intended as a continuation and consolidation of the ideas behind these earlier tools, while adding its own queueing, caching, throttling, dynamic scanning, status tracking, and error-handling systems.
