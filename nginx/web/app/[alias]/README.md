# ALGORITHM (PUBLIC LOBBY):
    1. Player enters the lobby
        - Ask the specific lobby server how many people are in the game and if more can join
    2. Player enters the game
        - Connect to the socket for this lobby
            * Figure out if there are different routes on one socket or if more than one socket is needed to manage all of the games
        ->Client receives question event from the serer
            * This includes a timestamp of when the question started. Using the speed of the game, then the client renders the text appropriately
        ->Client receives buzz event
            * Pause the question
            * Through the socket, show the typing of the other player who buzzed
        - User presses buzz
            * Communicate to the socket that the user has buzzed, and every 100 ms or so send the server the text that the user is typing
        -> Client sends points update
    3. Repeat (game never finishes)

# FUNCTIONS:
    1. Client-side
        -> checkLobbyStatus() NOT IN /play
        -> joinLobby() NOT IN /play
        <- playerJoined()
        <- calculateQuestionCharsFromTimestamp()
        -> questionInterrupt()
        <- questionResume()
        -> buzz()
        -> displayTyping()
        -> submitAnswer()
        <- receiveNextQuestion()
        <- updatePoints()
        -> gamePause()
        -> gameResume()
    2. Server-side
        - Incomming events
            * onCheckLobbyStatus() HTTP ROUTE
            * onJoinLobby()
            * onBuzz()
            * onTyping()
            * onSubmit()
            * onQuestionResume()
            * onGameResume()
            * onGamePause()
        - Outgoing events
            * playerJoined()
            * questionInterrupted()
            * questionResume()
            * displayPlayerTyping()
            * playerAnswered()
            * nextQuestion()
            * rewardPoints()
            * gamePaused()

# DATA PACKETS:
    1. Client sends:
        *Each event name here corrosponds to the incoming events
        under the Server-side point above*

        -> onCheckLobbyStatus * NON-SOCKET
            * No data needed

        -> onJoinLobby
            * No data needed
        -> onBuzz
            * BuzzTimestamp
        -> onTyping
            * AnswerContent
        -> onSubmit
            * FinalAnswer
        -> onGameResume()
            * Player
        -> onGamePause()
            * Player


    2. Server sends this data:
        * We want to minimize the amount of events we send out,
        so we want to bundle as much information together as
        we can. Subsequently, here are some intances in the game
        when we will be sending out events, along with the
        corrosponding data that each event will contain. There 
        will be one event type for each of these items*

        - playerJoined
            TO OTHER PLAYERS: * PlayerInformation
            TO JOINING PLAYER: * GameState
        - questionInterrupt
            * Player, AnswerContent
        - playerTyping
            * Player, AnswerContent

        - questionResume
            * Player, FinalAnswer, Scores, IsCorrect
        OR
        - nextQuestion
            * Player, FinalAnswer, Scores, IsCorrect, Question
        - rewardPoints
            * Scores

        - gameResume
            * Player
        - gamePause
            * Player

# DATABASE FUNCTIONS
    *We need to keep track of the state of the game in our database in case people are joining the game. I think the single socket will end up managing all of the games, unless I add unique routes on the socket for each game, but the difference is the same to the database and game state management*

    1. onJoinLobby
        - player_join_lobby(player_id, lobby_id)
            * Update the Player's id to reflect which lobby they now in
            * Add the player's id to the Game's manifest
            * Add a score of 0 for the player
    2. onBuzz
        - player_buzz(player_id, lobby_id)
            * Set the status of the lobby to interruptor and the player who is buzzing
    3. onTyping
        - Nothing
    4. onSubmit
        - check_answer(answer, lobby_id)
            * Checks the answer to the passed lobby's current question
        - record_player_stats(player_id, correct, question_id)
            * Edits the player's stats
            * Increment buzzes
            * If correct, add points
            * If correct, increment correct questions
            * If correct, add to user's correct list
            * If incorrect, add to user's incorrect list
        - next_question(lobby_id)
            * Fetch a new question for the lobby and set it as the lobby's game's current question
    5. onQuestionResume
        - resume_question(lobby_id)
            * Set the status of the lobby to tossup_running
    6. onGameResume
        - resume_game(lobby_id)
            * Set the status of the lobby to tossup_running
    7. onGamePause
        - pause_game(lobby_id)
            * Set the status of the game to paused

# GAME STATUSES
    1. TOSSUP_RUNNING
    2. TOSSUP_INTERRUPTED
    3. TOSSUP_WAITING
    4. TOSSUP_DEAD
    5. BONUS_RUNNING
    6. BONUS_INTERRUPTED
    7. BONUS_WAITING
    8. BONUS_DEAD
    9. PAUSED
    10. LOADING
    11. ERROR

# GAME STATE COMPONENTS
    ## Solos
        - UI
            * Rows of scores
            * Color dot for each player and name on the left
            * Score on the right
            * Info button for other score information when you click on the score
        - Data Structures
            * Scores will be managed through the game object's "teams" JSON
                teams: {
                    hash: {
                        name: string,
                        color: hex,
                        score: number,
                        members: {
                            hash: {
                                points: number,
                                power: number,
                                incorrect: number,
                                buzzes: number,
                                buzzes_encountered: number,
                                early: number,
                            } ...
                        },
                    }...
                }
            * Every time a question is given, we need to increment the number of questions a user has seen for stats
            * Every time someone submits, we need to update their stats from the results. We also need to update buzzes_encountered, that helps with the participation rate we track for a user
    ## Custom teams
        - UI (for more than 2 teams)
            * Make it like a hamburger looking thing. A colored top bar followed by individual scores and repeat
        - Data Structures
            * Same as solos
    ## 5v5
        - UI
            * Two columns with total score on top
            * Individual score following that
    ## Settings
        - UI
            * Hidden, but with a cog drop down like in the prelobby
            * Relatively similar to prelobby custom settings
            * Only one column of settings
            * Make things skinnier
            * Add dropdowns for categories so this shit doesn't get too long
        - Logistics
            * Only editable to the party leader
            * Operate through the still open lobby socket?
            * Hit an end point that writes directly to the database so that the rules are applied immediately

# GAME STATE BACKEND
    ## Events
        - When a user joins
            * Add them to the scores according to the gamemode
        - When there is a new question
            * Update questions seen in the scores
            * At the end of the game, these will be transfered into the stats of a user
        - When a user submits
            * Update their scores data and buzzes
            * Likewise, at the end of the game this data will be inputted into their player stats
        - When a user leaves
            * Put their temporary scores data into their stats db object
            * Remove this user from the stats