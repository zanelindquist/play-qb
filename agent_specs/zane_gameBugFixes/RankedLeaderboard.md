# Component: \<RankedLeadboard/>
Created in ./002-ranked-leaderboard.md

## Summary
Static leaderboard component on the /leaderboard page. Should display top 20, 10, or 5 enteries. Enable pagenation through props.

---

## Purpose
- Display global rank and rank rating

---

## Props / Inputs

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| leaderboard | backend leaderboard dict | yes | - | Covered in LiveLeaderboard.md |
| onPageLeft | callback | no | null | Scroll through leaderboard |
| onPageRight | callback | no | null | Scroll through leaderboard |


---

## State (if applicable)

| Name | Type | Description |
|------|------|-------------|
| page | integer | Tracks which page the leaderboard is on |

---

## Behavior

- Data is procured by the parent component and passed in the leaderboard object to this component
- On pagination, use the callback to tell the parent the page
    - When the parent receives the page, it should query the server or search the cached leaderboards (have a cache leaderboard of like 10 in case the user keeps switching around)
- Show the user's place at the bottom

---

## Rendering Logic

- No conditional rendering

Example:
- If `isLoading` → show spinner
- Else → show content

---

## Events / Handlers

| Name | Trigger | Description |
|------|--------|-------------|
| none

---

## API / External Calls (if applicable)

- Handled by the parent component using getProtectedRoute

---

## Auxiliary Components

| Name | Implementation | Exists | Description |
|------|--------|----|-------------|
| GlassyView | Container | yes | Provides a clean base for housing content |
| LeaderboardRow |  Table Row | no | See implemeation details in ./LiveLeaderboard.md |
| RankUser | User | yes | Put above the leaderboard, centered. Shows stats |
---

## Dependencies

- None

---

## Styling

- Inside a GlassyView dark, have a centered RankInfo component at the top
- Below that, show table information, like the season (in a drop down). There aren't seasons right now, but design it with this in mind
- Below that, include a leaderboard with table headings and 10 LeaderboardRow components
- If the user is not in the top 10, show a ... for a row and then the user's inforation

---

## Edge Cases

- [ ] What happens if props are missing?
- [ ] What happens if data is empty?
- [ ] Loading / error states handled?

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
- Performance considerations