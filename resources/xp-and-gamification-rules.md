# Vynce XP & Gamification Rules

---

## Ethereum (ETH) Bounty System

### Task Creation
- Creator specifies an `ethereum` bounty (minimum 1)
- The bounty is **deducted from the creator's ETH balance at task creation**
- If the creator has insufficient ETH, task creation fails
- The `assigned` value is what the creator set
- The `calculated` value is what the assignee actually receives (may differ due to mood multiplier)

### Mood Multiplier (on task creation and restore)
The assignee's current mood affects the calculated reward:
- ANGRY: ×1.5
- CRYING: ×1.3
- SAD: ×1.2
- NORMAL: ×1.0
- OKAY: ×1.0
- HAPPY: ×1.0
- ECSTATIC: ×1.0

Example: 10 ETH assigned to an ANGRY assignee → 15 ETH calculated reward

### Task Closure (Reward)
- Creator closes a submitted task using `close-task`
- Assignee receives the `calculated` ETH reward
- If the task is overdue at time of closure, a penalty is applied to the calculated reward:
  - 1–7 days late: −10%
  - 8–14 days late: −20%
  - 15+ days late: −30%
  - Minimum reward is always 1 ETH (never goes to 0)
- Creator gets back nothing — ETH was deducted at creation

### Task Archive (No Reward)
- Creator archives a task using `archive-task`
- Assignee receives nothing
- The ETH that was deducted from the creator at creation is **refunded to the creator**

---

## Motivation & Leveling System

### Motivation Score
- Earned by working (timer-based) on tasks
- Each minute worked = `2 × difficulty` motivation points added
- Difficulty ranges from 1 to 5

### Motivation Level
- Every 3000 motivation points = 1 motivation level
- Formula: `motivationLevel += floor(totalMotivation / 3000)`, remainder carries over
- Stored separately from motivation score

### Weekly XP (Leaderboard)
- `weeklyXP` is tracked per membership (per project)
- Used for the leaderboard — top 7 members ranked by weeklyXP
- Resets weekly (via cron job)

---

## Mood System
- Users can set their mood manually
- Valid values: ANGRY, CRYING, SAD, NORMAL, OKAY, HAPPY, ECSTATIC
- Mood auto-expires back to NORMAL after 3 hours
- Mood affects ETH multiplier when tasks are created or restored

---

## Work Timer
- Only the assignee can start/stop the timer
- Timer tracks total worktime in seconds
- Each stop session adds motivation points based on minutes worked × 2 × difficulty
- Timer is automatically stopped on task submission
