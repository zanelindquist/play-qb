# Feature: <Short Name>

## Summary
One-paragraph description of what this feature does and why it exists.

---

## Goals
- What this feature MUST accomplish
- Focus on outcomes, not implementation

## Non-Goals
- What this feature explicitly does NOT do
- Prevents scope creep

---

## Requirements

### Functional Requirements
- [ ] The system must ...
- [ ] The user can ...
- [ ] The API should ...

### Edge Cases
- [ ] What happens if input is invalid?
- [ ] What happens if data is missing?
- [ ] What happens under race conditions?

### Constraints
- Performance requirements
- Security considerations
- Data limits

---

## Components

### New Components
- Component -> ./Component.md

### Modifications
- Component
  - Modiy props
  - New behavior
---

## Data Model

### New Tables / Fields
```sql
-- example
users:
  - rating (int)
  - sigma (float)
```
