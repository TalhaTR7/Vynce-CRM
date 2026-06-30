# Vynce Auction & Marketplace Rules

---

## What is an Auction?
A task assignee can put their assigned task on the marketplace for bidding. Other project members can bid to take over the task. The winner gets reassigned as the new assignee.

---

## Opening an Auction
- Only the **current assignee** can put a task on auction
- The task **must have a due date** to be auctioned
- The assignee sets an `endsAt` datetime for when the auction closes
- Constraints on `endsAt`:
  - Must be in the future
  - Must be at least **3 days from now**
  - Must be at least **3 days before the task's due date**
- Bidding closes automatically **2 days before** `endsAt` (derived, not user-set)
- A task already on auction cannot be put on auction again

---

## Auction Statuses
- `OPEN` — active, bids are being accepted
- `CLOSED` — auction ended, winner assigned
- `EXPIRED` — bidding time passed with no resolution

---

## Bidding Rules
- Any project member can bid **except the current assignee**
- Bid amount must be greater than 0
- Bids can only be placed while auction is OPEN and before `biddingEndsAt`
- A user can update their existing bid (submitting a new amount replaces old bid)
- Winner is determined by **lowest bid** — earliest bidder wins ties

## Winner Selection Strategy
- Automatic: lowest bidder wins (earliest submission wins ties)
- Manual override: the assignee can manually pick a winner using `close-auction` as long as the winner has placed a bid
- Manual close is only available while auction is OPEN

---

## Cancelling an Auction
- Only the assignee can cancel (take off market)
- Only possible while status is OPEN
- All bidders are notified of cancellation
- Task returns to normal, `onAuction` set to false

---

## What Happens When Auction Closes
- Auction is deleted
- Task is reassigned to the winner
- Winner is notified
- `onAuction` flag is set to false on the task

---

## Key Constraints Summary
- Task must have due date → can auction
- endsAt must be 3+ days from now AND 3+ days before due date
- biddingEndsAt = endsAt − 2 days (automatic)
- Assignee cannot bid on own task
- Only assignee can open, close, or cancel an auction
- Lowest bid wins; earliest submission wins ties
