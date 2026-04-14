# Component: \<LiveLeaderboard/>
Created in 002-ranke-leaderboard.md

## Summary
This component is used in ranked modes to track the user's live rank. It should be good looking, have satisfying ranked up animations and add to overall user experience. Data curation should happen external to this component throught the game socket, so this component will only render the data.

---

## Purpose
- Add to user ranked experience
- Display the user's global rank an Rank Rating (RR)

---

## Props / Inputs

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| leaderboard | backend leaderboard dict | yes | - | Should contain information about the passed leaderboard (such as the season, etc). It should also contain a "users" attribute that is an array of the users on the leaderboard adjacent to me (see data section). |
| user | user dict | yes | - | A dict of the current user. Compare to the leaderboard.users for rendering |

---

## State (if applicable)

| Name | Type | Description |
|------|------|-------------|
| user | user dict | The current user's dict. Used to track the user's place and display other info |

---

## Behavior

- When a leaderboard object is passed from the parent component, compare that data to previous data, such as placement and RR.
    - If the new info is different, show a smooth animation of the user's place moving up or down
    - Use green and red triangle chevrons to indicate movement
- Include a button to display additional ranked info

---

## Rendering Logic

- What changes based on props/state?
    - The user's position will change based on the passed leaderboard dict

---

## Events / Handlers

| Name | Trigger | Description |
|------|--------|-------------|
| onToggleInfo | Button click | Toggle hidden rank information |

---

## API / External Calls (if applicable)

- Unneeded, data should be acquired by the parent component

---

## Auxiliary Components

| Name | Implementation | Exists | Description |
|------|--------|-----|-------------|
| ExpandableView | Animation Container| yes | Allows the container to expand and contract when additional ranked information is toggled |
| GlassyView | Container| yes | Provide standardized display base |
| ChevronDropDown | Toggle Hidden Info | idk | Show or hide additional ranked content
| LeaderboardRow | Table Row | no | Create a standarized ranked row with global position, username, ranked rating, and user leaderboard movement|
---

## Dependencies

- None

---

## Styling

- Use ustyles.flex templates where possible
- Render the 2 users around this user
    - Normally, sandwich the user, but if the user is #1, render the 2 users below
    - Similarly, if the user is last, render 2 users above
- Component should be in a vertical manner:
    - Small "leaderboard" title at the top
    - Leaderboard at the top consisting of ranked rows seperated by thin lines that don't extend all the way across the component
    - Small dropdown at the bottom to render additional ranked information
        - Name, RR, act (in the future), etc

- ***Unimplemented*** On the right of the whole component, include a little vertical line sidebard with dots that indicate percentil milestones maybe and show where a user's position is in the grand scheme of things

---

## Edge Cases

- If there is no leaderboard data, render an ActivityIndicator

---

## Acceptance Criteria

- [ ] Component renders correctly
- [ ] All props work as expected
- [ ] Handles edge cases
- [ ] No console errors
- [ ] Matches design/spec

---

## Notes (Optional)

- Any implementation hints
    - In the game page (/[alias]), render it above the GameScores