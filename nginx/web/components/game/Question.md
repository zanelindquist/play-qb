# <Question> COMPONENT
A. Functionality
    1. Read out the question character by character
        - Stop when someone buzzes
        - Resume if the user gets the answer wrong
        - Go to the next question if the user gets it right
    2. Display a bar indicating the duration of time left in a certain phase of this question
        - Phase 1: Blue bar: Question is being read
            * Pause this when a user buzzes
        - Phase 2: Green bar: Player has buzzed
            * Begin when a user has buzzed
            * End when the user has submitted answer
        - Phase 3: Red bar: Question is waiting for buzz or it dies
            * Begin when the question is finished being read
            * End when the time is up and question is dead
    - Display the answer to the question when it is dead or answered
B. Flow of life
    1. Push a new question to the top of a useState array
    2. Render the top question as the one being read out
        - Maximized question begins reading out
        - A user buzzes at some point
            * Props are passed to the <Question> chaing its state to "interrupted"
            * In the interrupted state, the buzz clock bar starts ticking down
        - When the user submits
            * Correct question: skip to #3
            * Incorrect question: Props are passed to <Question> changing its state to "running"
        - When the question ends
            * <Question> sets own state to "waiting"
        - When the question dies
            * <Question> sets own state to "dead"
    3. Wait for the user to continue to the next question
        - When the user does this, change the <Question> state to minimized, which will trigger an animation that collapses the question
        - Simultaneously, step 1 will occur



