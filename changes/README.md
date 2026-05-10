<p align="center">
  <img src="https://assets.trivajs.com/header.jpg" alt="Triva header">
</p>

# Release Notes

This directory stores project change history that is better kept in versioned files than in the public docs navigation.

## Structure

- `versions/`: historical release notes by version
- `README.md`: index and authoring notes for release documentation

## Current Sources of Truth

- Historical release note snapshots: `changes/versions/`
- This README: release-note workflow and authoring guidance

## Adding a New Release Note

1. Create a new file in `changes/versions/` named after the release, for example `v1.1.0.md`.
2. Summarize notable improvements, fixes, and migration notes.
3. Update this index if the release changes how notes are organized or maintained.
4. Refresh any public docs pages that reference newly supported features, adapters, or examples.

## Writing Guidelines

- Keep entries user-facing and outcome-oriented.
- Group changes by `Added`, `Changed`, `Fixed`, and `Security` when helpful.
- Link to commits, PRs, or issues only when they add useful context.
- Call out breaking changes and migrations explicitly.
