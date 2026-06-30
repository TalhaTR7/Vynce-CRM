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
