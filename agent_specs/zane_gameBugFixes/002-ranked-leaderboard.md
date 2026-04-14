# Feature: Ranked Leaderboard

## Summary
More Quiz Bowl needs a global leaderboard based upon ranked skill. RR is defined by mu - 2 * sigma, and RR will be used to ranked users. This page should be found at /leaderboard. Additionally, we want to utilize the same backend infrastructure to be able to render an in-game ranked leaderboard that only shows where a user's global rank is compared to other users. There will be two components: Leaderboard and LiveLeaderboard. One is more comprehensive and static, and the other will be live and receive ranked data from the game socket.

---

## Goals
- On the backend, there needs to be an efficient function (maybe an SQL select and order by RR), possibly with caching (if there are a lot of users) to show or estimate user ranks
- The /leaderboard page should show the top 20 players followed by a ... to the global rank of the user
- The LiveLeaderboard should only show the user's relative position in the ranks with maybe like 5 people near them and their RR
- Both leaderboards should also tell them what percentile they are in
  - This can either happen through gaussian (or chai squared) ranked curve distribution estimation or analyzing rows and seeing where the user is
- Use common components where possible

## Non-Goals
- What this feature explicitly does NOT do
- Prevents scope creep

---

## Requirements

### Functional Requirements
- /leaderboard should render a static, comprehensive ranked leaderboard
- Reference the specific component files for more implementation details
- /leaderboard should make the getProtectedRoute request and give the ranked array to the Leaderboard component
- The in-game ranked leaderboard should get its initial information throught the "you_joined" event, but when the user's position changes there should be a seperate event that is received and used to fully update the ranking table
- On the game page, put the leaderboard on the right sid where the user's account is currently displayed

### Edge Cases
- If data can't be loaded for any reason, show an activity indicator for 5 seconds and then show a message telling them we can't load data
- If there are fewer than 20 ranked users, load 10, if there aren't 10, load 5 so that there is always some gap between the last ranked person and you

### Constraints
- Performance requirements
  - Avoid querying the database too much
  - Update the table with the user's individual ranked information that is given on each next_question event if the user's overall standing doesn't change
- Security considerations
- Data limits
  - Transmit and query the minimum amount of needed data

---

## Componentss

### New Components
- LiveLeaderboard -> ./LiveLeaderboard.md
  - This leaderboard data should be of the type relative, and only show the player above and below the employee
- RankedLeaderboard -> ./RankedLeaderboard.md

### Modifications
- Component
  - Modiy props
  - New behavior

---

## Data Model

### New Tables / Fields
- None
### New Data Structures
- On the backend, aggregate leaderboard info into a dict like:
```
{
  "info": {
    "season": "Season 1",
    "rows": 10,
    "type": "absolute" or "relative" (absolute starts at 1, relative pads the user's rank),
    ...
  },
  "users": [
    {
      "username": "ukiarg",
      "rank": 1,
      "rr": 845
    }, ...
  ]
}
````
