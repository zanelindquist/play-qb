# Component: ChatMessage

## Summary
Component for displaying chat messages in both the /game chat and in lobby chat.

---

## Purpose
- Easy bundle up message style
- Maintain consistency across the app

---

## Props / Inputs

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| user | standard user distionary | yes | - | Will be used to access username and maybe link to the user's profile in the future. |
| message | string | yes | - | Message content |
| timestamp | UTC miliseconds | no | Date.now() | Used to show when a message was sent
| quantity | int | no | 1 | When messages are hidden, this will be used to show a badge of how many hidden messages are stacked

---

## State (if applicable)

| Name | Type | Description |
|------|------|-------------|
| hidden | bool | Indicate if a message is hidden or not |

---

## Behavior

- Have a hide button on the right hand side

---

## Rendering Logic

- Basically static except for hiding and showing

---

## Events / Handlers

| Name | Trigger | Description |
|------|--------|-------------|
| none

---

## API / External Calls (if applicable)

- None

---

## Dependencies

- List other components used
- Libraries or hooks

---

## Styling

- Horizontal flexbox bar, from left to right
    - Left "account" icon
    - Username
    - Message
    - Righthand hide icon that removes message content
- Below message, faint timestamp like 11:20 AM
- Use ustyles.text.textShadow for message text

---

## Edge Cases

- None, all handled at the level above

---

## Acceptance Criteria

- [ ] Component renders correctly
- [ ] All props work as expected
- [ ] Handles edge cases
- [ ] No console errors
- [ ] Matches design/spec

---

## Notes (Optional)

- Similar to the style of the \<Interrupt> component