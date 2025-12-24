# Lobby Screen
## Components
1. On the left side, we will have horizontal rows of gamemodes
    - On mobile these will be in a dropdown top option
2. On the right side, there will be the player party slots
    - When an empty slot is clicked, a widget for inviting a friend will pop up
        * This will utilize the useAlert() function with a custom component
3. Show fill or no fill for a gamemode

## Flow of events
1. The user clicks on the gamemode from the main page
2. The client is redirected to the lobby screen
3. Connection with a socket is established
    - This will be used to invite certain users to the party
    - This can also be used for chat messages
4. The user selects a gamemode
    - Solos will always be under the reserved lobby /solos
    - Duos will be under /duos
    - Fives will be under /fives
5. The socket will tell the user how many people are online in a certain gamemode
    - Maybe add wait time in the future (idk I don't think there will be a ton of players)
6. The socket gives the user an OK to join a certain game that belongs to a lobby
7. The user joins the game within the lobby
8. When a game finishes, the user is redirected to a stats page for that lobby
9. The player is redirected to the lobby

## Custom lobbies and rulesets
1. Each lobby must have its own ruleset in the database
    - This includes speed, rebuzzing, bonuses, max players, teams, ect
2. In the lobby screen, if the user selects to create a custom lobby, they can have the option to edit their own rule set
3. If the user wants to join an existing lobby or running game, then they can put in the lobby code, or request to join a friend who is already in a game