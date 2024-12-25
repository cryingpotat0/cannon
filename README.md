# Cannon

https://cannon.cryingpotato.com

## Roadmap
- Evaluate whether to move to WebContainers 🟢 (offering both)
- Error handling (429/ 500) 🟢
- Pipe through modal url correctly 🟢
- Rework the state management to use contexts. 🟢
- Request cache invalidation 🟢
- Cancellability of run
- better term color code support
- Figure out a good story for event handlers
- Astro plugin and theming story
- Better themes generally
- Scoped styles
- Other language support

- Cache intermediate build state 🟢 (instead of doing the below, just a simple hash of the args used to build the image. resulted in pretty large compilation speedups for rust.)
e.g.  for rust
```
    - parse dependencies in cargo.toml
    - Dispatch a new function to build an image with all those dependencies
    - Anytime you get a request with some overlap, use the image that has the most overlap in dependencies
        - How do you find something with maximum overlap?
        - well you can:
            - source: [(dep1, v1), (dep2, v2) ...]
            - candidate1: [(dep1, v1), (dep2, v2) ...]
            - candidate2: [(dep1, v1), (dep2, v2) ...]
        - Sort ascending and find maximum overlapping matches with and without version
        - Bias to max matches with version
        - Pick a random heuristic for whether to create a new image
    - Persist this image value in a modal dict
    - For a new image, try the overlapping image.
```



### 🎄 day todos before continuiing with roadmap:
- make updateLanguageProps more react like (take in last props, return new props)
- make sure run button keeps working with webcontainers/ sandpack
- xterm js move
- global window.webContainer instead of inside the react app

### The Big Rewrite
The abstractions all kind of work, but it feels like there's a lot of rough edges and bad flows right now. A big complication comes from highlighting and focusing. That requires a lot more state to manage and move.
Another issue is how well the local runners work. Python is single file only sadly, doesn't have support for package installs. Webcontainers are kind of hardcoded to a fixed install process with no way to reset it. Multiple webcontainers on a single page don't work.
Modal runners need to be fixed for color with the new Xterm runner.
No docs.

Hmm.
How to proceed?

Ok, Modal runners should always work. That is top priority.
I need at least one javascript based container. That is sandpack. Things should work well there, externalResources should be well documented. Failure events should be handled well.
Python should work with one file documentation shown.
The highlight and focus API are messed up.
The only highlight API should be `setHighlights`. Every time setHighlights is called, reset the highlight painting step. Every time something is edited in the file, highlights should be reset. Don't worry about movable comments/ highlights. This means reintroduce resetHighlights as an effect. It makes working with highlights much easier.
Focus should work better.

## bugs /features
- when switching languages in the builder, there's a gap where the buttons aren't disabled but the old language is active
- add an error boundary
- switching doesn't work perfectly, especially for javascript related things
- serialize iframe props
