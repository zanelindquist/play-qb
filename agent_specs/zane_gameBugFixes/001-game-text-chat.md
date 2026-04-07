# Feature: Game Text Chat

## Summary
MoreQB needs an in-game text chat to communicate with other user. This will happen through the /game socket. Messages don't need to be saved, but they need to be broadcasted and added to the user's history feed on the game's page.

---

## Goals
- Users should be able to hit enter when they are NOT typing a question.
- We don't want the text chat to interfere with the keybinds for answering a question.
- When the user is typing in the chat, we want to make sure that other keybinds (like space for buzzing or j for next question) are disabled
- Include an explicit filter using functionlity already present in the program (see utils/text.js)
- Follow in-place design patterns and functions where possible
- Mute user function that hides the content of messages and doesn't add new chat events, just modify the number of chats when hidden
- When a user is identified as muted, stack messages

## Non-Goals
- Messages don't need to be stored
- Everything should run through the /game socket, so when the user exists a game and the socket disconnects, they don't see messages

---

## Requirements

### Functional Requirements
- The system must receive text chats from users and broadcast them to other users
- Use the top question input bar for chat messages too. It can serve a dual purpose, because you can't be sending chats and buzzing at the same time.
- The frontend must display the chats in a clear way, similar to how answers are displayed. Include a little message icon so that these can be differentiated from buzzes
- The API should be lightweight, just acting as a mailman

### Edge Cases
- Messages with no content should not be sent to the backend

### Constraints
- Performance requirements
  - None
- Security considerations
  - Unneeded
- Data limits
  - Limit message length to 100 characters

---

## Components

### New Components
- ChatMessage -> ./ChatMessage.md

### Modifications
- AnswerInput
  - Handle dual-use for chat message input

---

## Data Model

### New Tables / Fields
- No new data fields