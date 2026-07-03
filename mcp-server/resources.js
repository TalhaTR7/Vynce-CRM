

export function resources(server) {

    server.registerResource(
        "role-permissions",
        "vynce://resources/role-permissions",
        { description: "OWNER, ADMIN, MEMBER permissions and restrictions" },
        async () => ({
            contents: [{
                uri: "vynce://resources/role-permissions",
                text: `
# Vynce Role Permissions

Vynce has three roles per project: OWNER, ADMIN, and MEMBER.

---

## OWNER
- Only one per project
- Created automatically when a project is created
- Cannot leave the project (must delete it or transfer ownership first)
- Cannot be removed by anyone
- Can delete the project (only if no other members remain)
- Can promote MEMBER → ADMIN
- Can demote ADMIN → MEMBER
- Can transfer ownership to an ADMIN (requires ADMIN acceptance)
- Can create tasks
- Can close tasks (reward assignee)
- Can archive tasks (no reward)
- Can restore archived tasks
- Can permanently delete archived tasks
- Can create, edit, move, and delete boards
- Can invite users to the project
- Can remove ADMIN and MEMBER
- Can access archives
- When demoting an ADMIN, all tasks created by that admin are transferred to the OWNER

## ADMIN
- Can create tasks
- Can close tasks (reward assignee)
- Can archive tasks (no reward)
- Can restore archived tasks
- Can permanently delete archived tasks (owner is notified)
- Can create, edit, move, and delete boards
- Can invite users to the project
- Can remove MEMBERs only (cannot remove OWNER or other ADMINs)
- Can access archives
- Can accept or decline ownership transfer offers
- When leaving the project: created tasks are transferred to OWNER, assigned tasks are archived

## MEMBER
- Cannot create tasks
- Cannot close or archive tasks
- Cannot restore archived tasks
- Cannot permanently delete archived tasks
- Cannot access archives
- Cannot create, edit, move, or delete boards
- Cannot invite users
- Cannot remove anyone
- Can submit tasks assigned to them
- Can add comments on tasks
- Can start/stop timer on assigned tasks
- Can place bids on auctioned tasks (except their own)
- Can open bidding on their assigned tasks
- When leaving the project: all assigned tasks are archived

---

## Key Rules
- Task creation requires OWNER or ADMIN role
- Task closure (with reward) requires being the task creator
- Task submission requires being the task assignee
- Assignee cannot bid on their own task
- Only the task assignee can put a task on auction
- Only the task assignee can close an auction or take it off market
- OWNER cannot be removed or demoted by anyone except through voluntary ownership transfer
- Ownership transfer requires the ADMIN to explicitly accept
- Project deletion requires OWNER role and zero other members
            `}]
        })
    );

    server.registerResource(
        "xp-and-gamification-rules",
        "vynce://resources/xp-and-gamification-rules",
        { description: "XP, ETH bounty system, mood multipliers, motivation scoring, and weekly leaderboard rules" },
        async () => ({
            contents: [{
                uri: "vynce://resources/xp-and-gamification-rules",
                text: `
# Vynce XP & Gamification Rules

---

## Ethereum (ETH) Bounty System

### Task Creation
- Creator specifies an \`ethereum\` bounty (minimum 1)
- The bounty is **deducted from the creator's ETH balance at task creation**
- If the creator has insufficient ETH, task creation fails
- The \`assigned\` value is what the creator set
- The \`calculated\` value is what the assignee actually receives (may differ due to mood multiplier)

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
- Creator closes a submitted task using \`close-task\`
- Assignee receives the \`calculated\` ETH reward
- If the task is overdue at time of closure, a penalty is applied to the calculated reward:
  - 1–7 days late: −10%
  - 8–14 days late: −20%
  - 15+ days late: −30%
  - Minimum reward is always 1 ETH (never goes to 0)
- Creator gets back nothing — ETH was deducted at creation

### Task Archive (No Reward)
- Creator archives a task using \`archive-task\`
- Assignee receives nothing
- The ETH that was deducted from the creator at creation is **refunded to the creator**

---

## Motivation & Leveling System

### Motivation Score
- Earned by working (timer-based) on tasks
- Each minute worked = \`2 × difficulty\` motivation points added
- Difficulty ranges from 1 to 5

### Motivation Level
- Every 3000 motivation points = 1 motivation level
- Formula: \`motivationLevel += floor(totalMotivation / 3000)\`, remainder carries over
- Stored separately from motivation score

### Weekly XP (Leaderboard)
- \`weeklyXP\` is tracked per membership (per project)
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
            `}]
        })
    );

    server.registerResource(
        "mood-values",
        "vynce://resources/mood-values",
        { description: "Valid mood values, their ETH multipliers on task creation and restoration, and usage guidance" },
        async () => ({
            contents: [{
                uri: "vynce://resources/mood-values",
                text: `
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
- Mood is set by the user manually using the \`update-mood\` tool
- Mood auto-resets to NORMAL after 3 hours of inactivity
- The multiplier applies to the **assignee's mood at the time of task creation or restoration**
- The multiplier affects the \`calculated\` reward, not the \`assigned\` value
- Negative moods (ANGRY, CRYING, SAD) give higher multipliers on task creation — rewarding assignees more for working while feeling bad
- For task restoration, the full spectrum matters — positive moods also give higher multipliers

## Usage
When creating or restoring a task, always call \`get-user-by-id\` on the assignee first to check their current mood. This tells you what the calculated reward will be before committing.
            `}]
        })
    );

    server.registerResource(
        "auction-rules",
        "vynce://resources/auction-rules",
        { description: "Auction lifecycle, bidding rules, timing constraints, winner selection, and cancellation rules" },
        async () => ({
            contents: [{
                uri: "vynce://resources/auction-rules",
                text: `
# Vynce Auction & Marketplace Rules

---

## What is an Auction?
A task assignee can put their assigned task on the marketplace for bidding. Other project members can bid to take over the task. The winner gets reassigned as the new assignee.

---

## Opening an Auction
- Only the **current assignee** can put a task on auction
- The task **must have a due date** to be auctioned
- The assignee sets an \`endsAt\` datetime for when the auction closes
- Constraints on \`endsAt\`:
  - Must be in the future
  - Must be at least **3 days from now**
  - Must be at least **3 days before the task's due date**
- Bidding closes automatically **2 days before** \`endsAt\` (derived, not user-set)
- A task already on auction cannot be put on auction again

---

## Auction Statuses
- \`OPEN\` — active, bids are being accepted
- \`CLOSED\` — auction ended, winner assigned
- \`EXPIRED\` — bidding time passed with no resolution

---

## Bidding Rules
- Any project member can bid **except the current assignee**
- Bid amount must be greater than 0
- Bids can only be placed while auction is OPEN and before \`biddingEndsAt\`
- A user can update their existing bid (submitting a new amount replaces old bid)
- Winner is determined by **lowest bid** — earliest bidder wins ties

## Winner Selection Strategy
- Automatic: lowest bidder wins (earliest submission wins ties)
- Manual override: the assignee can manually pick a winner using \`close-auction\` as long as the winner has placed a bid
- Manual close is only available while auction is OPEN

---

## Cancelling an Auction
- Only the assignee can cancel (take off market)
- Only possible while status is OPEN
- All bidders are notified of cancellation
- Task returns to normal, \`onAuction\` set to false

---

## What Happens When Auction Closes
- Auction is deleted
- Task is reassigned to the winner
- Winner is notified
- \`onAuction\` flag is set to false on the task

---

## Key Constraints Summary
- Task must have due date → can auction
- endsAt must be 3+ days from now AND 3+ days before due date
- biddingEndsAt = endsAt − 2 days (automatic)
- Assignee cannot bid on own task
- Only assignee can open, close, or cancel an auction
- Lowest bid wins; earliest submission wins ties
            `}]
        })
    );

}