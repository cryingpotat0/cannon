# Cannon

https://cannon.cryingpotato.com

## Roadmap
- Evaluate whether to move to WebContainers
- Error handling (429/ 500)
- Pipe through modal url correctly
- Cancellability of run
- better term color code support
- Figure out a good story for event handlers
- Rework the state management to use contexts.
- Astro plugin and theming story
- Better themes generally
- Scoped styles
- Other language support
- Request cache invalidation

- Cache intermediate build state
e.g.  for rust
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


