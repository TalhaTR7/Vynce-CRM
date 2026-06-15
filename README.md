# Vynce-CRM Progress Report

11th March, 2026 — Vynce-CRM is a specialized project and task management ecosystem designed to blend productivity with gamification. It tracks progress and user engagement through mood-based rewards, motivation scoring, and a competitive marketplace for tasks.

---

## 🛠️ Service Architecture & Features

### 1. **Project & Workspace Management**
*   **Dynamic Creation**: Users can create projects with custom branding (Project Images).
*   **Role-Based Access Control**: Standardized roles (`OWNER`, `ADMIN`, `MEMBER`) governing permissions.
*   **Board System**: Each project can host multiple Kanban boards to categorize workflows.
*   **Project Settings**: Complete management of project metadata, board configurations, and member lists.

### 2. **Advanced Task Management**
*   **Full CRUD**: Create, read, update, and delete tasks with ease.
*   **Detailed Tracking**: Tasks support titles, descriptions, difficulty levels, and due dates.
*   **Dynamic Rewards (Ethereum)**: 
    *   Tasks carry "Ethereum" rewards.
    *   **Mood-Based Multipliers**: Rewards are automatically scaled based on the assignee's current mood (ANGRY, CRYING, SAD, NORMAL, OKAY, HAPPY, ECSTATIC), rewarding users for persistence during difficult states.
*   **Precision Timer**: Integrated stopwatch to track exact `worktime` spent on tasks.
*   **Motivation Scoring**: Automatically calculates and rewards user "Motivation" based on active work segments.

### 3. **The Marketplace (Task Auctions)**
*   **Open Bidding**: Users can put their tasks on the marketplace for others to bid on.
*   **Earliest Bidder Strategy**: Automatic winner selection based on the lowest bid and earliest submission.
*   **Manual Control**: Task owners can manually close auctions and select a winner from the bidders.
*   **Fluid Reassignment**: Automated transfer of task ownership upon auction closure.

### 4. **Social & Collaboration**
*   **Real-time Chat**: Integrated messaging system for direct communication between users.
*   **Real-time Activity Logs**: Every change (title, status, bounty, etc.) is recorded in a task-specific activity feed.
*   **Communication**: Integrated comment system within each task for direct collaboration.
*   **Invitation System**: Standardized invitation flow with pending, accepted, and declined states.
*   **Notifications (Inbox)**: Personalized inbox notifying users of assignments, invitations, project changes, and more.

### 5. **Gamification & Analytics**
*   **Weekly Leaderboards**: Competitive rankings based on `WeeklyXP`.
*   **Automated Resets**: Scheduled worker (`node-cron`) that resets competitive stats every Sunday.
*   **Motivation Profiles**: User profiles track overall motivation scores and mood history.

---

## 🏗️ Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend** | Node.js & Express | Core API & Routing |
| **Database** | MongoDB & Mongoose | Data modeling and persistence |
| **Authentication** | JWT & Bcrypt | Secure login and request authorization |
| **File Handling** | Multer | Image uploads for projects and users |
| **Frontend** | React (v19) & Vite | Fast, reactive user interface |
| **Styling** | Sass (SCSS) | Modular and structured CSS |
| **State** | React Context API | Global state for Modals and Moods |
| **Interaction** | @dnd-kit | High-performance drag and drop |
| **Automation** | Node-cron | Scheduled database maintenance |

---

## 📈 Summary of Achievements
*   [x] Robust Authentication and User Session management.
*   [x] Fully functional Project and Kanban Board system.
*   [x] Complex Task lifecycle (Timer, Rewards, Mood integration).
*   [x] Integrated Marketplace for internal task trading.
*   [x] Automated Notification and Inbox services.
*   [x] Weekly competitive metrics and automated cron jobs.
*   [x] Integrated Messaging/Chat system.
