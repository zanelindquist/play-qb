
#ALGORITHM (PUBLIC LOBBY):
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

    FUNCTIONS:
    1. Client-side
        -> checkLobbyStatus()
        -> joinLobby()
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

    DATA PACKETS:
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

        - gameResume
            * Player
        - gamePause
            * Player
