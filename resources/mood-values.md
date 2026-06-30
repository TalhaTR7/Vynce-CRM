# Vynce Mood Values

Valid mood values for a user in Vynce:

| Mood     | ETH Multiplier (task creation) | ETH Multiplier (task restore) |
|----------|-------------------------------|-------------------------------|
| ANGRY    | ×1.5                          | ×2.0                          |
| CRYING   | ×1.3                          | ×1.7                          |
| SAD      | ×1.2                          | ×1.3                          |
| NORMAL   | ×1.0                          | ×1.0                          |
| OKAY     | ×1.0                          | ×1.3                          |
| HAPPY    | ×1.0                          | ×1.7                          |
| ECSTATIC | ×1.0                          | ×2.0                          |

---

## Notes
- Mood is set by the user manually using the `update-mood` tool
- Mood auto-resets to NORMAL after 3 hours of inactivity
- The multiplier applies to the **assignee's mood at the time of task creation or restoration**
- The multiplier affects the `calculated` reward, not the `assigned` value
- Negative moods (ANGRY, CRYING, SAD) give higher multipliers on task creation — rewarding assignees more for working while feeling bad
- For task restoration, the full spectrum matters — positive moods also give higher multipliers

## Usage
When creating or restoring a task, always call `get-user-by-id` on the assignee first to check their current mood. This tells you what the calculated reward will be before committing.
