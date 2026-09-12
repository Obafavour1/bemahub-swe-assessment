# Task 6 — Infrastructure



## Incident 1 — The Invisible Deploy

A fix was pushed, the build passed, deployment is green, but the browser does not show the change. A colleague says it works for them.

### What I would check, in order

1. Refresh and bypass browser cache
   - First I would hard refresh the page or open it in a private/incognito window.
   - This is the cheapest and fastest check.
   - If the change appears there, the issue is likely browser cache or stale frontend assets.

2. Check whether I am looking at the correct environment
   - I would confirm the URL and whether I am on production, staging, or another environment.
   - This rules out the possibility that the deployment succeeded somewhere else while I am checking a different environment.

3. Check the deployed version or commit SHA
   - I would compare the commit that was pushed with the commit actually deployed.
   - If possible, I would expose or inspect a build version, image tag, or commit SHA.
   - This confirms whether the expected code is actually running.

4. Check CDN, reverse proxy, or server-side caching
   - If the correct version is deployed but I still see old output, I would check whether Nginx, a CDN, or another cache layer is serving stale content.
   - This is especially likely if another colleague sees the new version but I do not.

5. Check frontend static assets
   - I would inspect the browser Network tab and check which JavaScript/CSS files are being loaded.
   - If old hashed assets are being served, then the browser or cache layer may still be returning an older build.

6. Compare with the colleague who says it works
   - I would compare:
     - exact URL
     - browser
     - environment
     - response headers
     - loaded asset versions
   - This helps identify whether the difference is local to me or caused by infrastructure routing/caching.

### Why this order

I start with the simplest and most likely causes first: browser cache and wrong environment. I only move to deployment versioning and infrastructure caching if those checks do not explain the issue.


## Incident 2 — 502 After Deploy

The app works locally, but every API request returns `502 Bad Gateway` after deployment. The container is running, and the only new change reads a configuration value.

### Most likely causes

The first thing I would suspect is a missing, incorrect, or invalid environment/configuration value because that was the only change introduced.

### What I would check, in order

1. Check the new environment variable/config value
   - I would confirm that the new variable exists in the deployed environment.
   - I would also check that the name matches exactly, including spelling and case.
   - This rules in or out the most likely cause based on the recent change.

2. Check application logs inside the container
   - A container can be "running" while the application inside it is failing or repeatedly crashing.
   - I would check startup and application logs for errors such as:
     - missing configuration
     - invalid URL
     - failed connection
     - unhandled exception
   - This tells me whether the application itself is healthy.

3. Check whether the application is listening on the expected port
   - I would confirm the app is actually listening on the port expected by Nginx or the load balancer.
   - A running container does not guarantee that the service inside it is reachable.

4. Call the application directly, bypassing the proxy
   - If possible, I would send a request directly to the container/app port.
   - If the direct request works but Nginx returns 502, the problem is probably in proxy/upstream configuration.
   - If the direct request also fails, the application/configuration is the more likely problem.

5. Check Nginx/reverse proxy upstream configuration
   - I would confirm that the proxy is pointing to the correct host and port.
   - I would also check whether the upstream name or container network changed.

6. Compare deployed configuration with yesterday's working deployment
   - Because it worked yesterday, I would compare the previous working environment values and deployment configuration with the current one.
   - This helps isolate the exact difference.

### Most likely explanation

Because the only code change introduced a new configuration value, I would first suspect that the variable is missing or incorrect in production. That could cause the application to fail internally while the container itself still appears to be running, leading the reverse proxy to return `502 Bad Gateway`.


## Incident 3 — The Vanishing Change

A colleague installed a tool directly inside a running container. It worked temporarily, but after the next deployment the tool disappeared and the fix stopped working.

### What happened

Containers are intended to be replaceable and reproducible.

The colleague changed the running container itself, but that change was not added to the Docker image or source-controlled configuration.

When the next deployment happened, the old container was replaced with a new container created from the original image. Because the tool was never part of that image, it disappeared.

The same problem applies to any manual code or configuration change made only inside a running container.

### How it should have been done

The change should have been made in the source used to build the container.

For example:

- if a system package is required, add it to the `Dockerfile`;
- if a Node/Python/PHP dependency is required, add it to the project's dependency files;
- if configuration is required, add it through the proper environment/configuration system;
- if code needs changing, change it in the repository and commit it.

Then rebuild the Docker image, deploy it, and verify the new container contains the required change.

### Why this matters

A production container should be reproducible. If the environment can only be recreated by manually installing something after deployment, the deployment process is incomplete and the change will disappear whenever the container is replaced.