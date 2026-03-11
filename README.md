# Vynce CRM - Project Overview & Status

11 March, 2026 — This document provides a comprehensive summary of the current state of the Vynce CRM, the services it provides, its architecture, and the roadmap for future development.

## Project Goal
Vynce CRM is a gamified task and project management system designed to track productivity, monitor user mood/motivation, and manage collaborative efforts through a bounty-based system.

## Current Software Capabilities

### 1. User Management & Authentication
- **Secure Auth**: Signup and Login using JWT and Bcrypt hashing.
- **Profiles**: Customizable user profiles with images and mood tracking.
- **Mood System**: Users can set their status (ECSTATIC, HAPPY, NORMAL, SAD, etc.), which influences their motivation scores.
- **Experience points (Ethereum)**: System to reward users with "points" for task completion.

### 2. Project & Task Management
- **Hierarchical Structure**: Projects containing multiple Boards (Kanban style).
- **Task Lifecycle**: Creation, Assignment, Description, Due Dates, and Difficulty levels.
- **Interactive Boards**: Support for moving tasks between boards (ToDo, In Progress, Review, Done).
- **Bounty System**: Individual tasks can be assigned "Ethereum" rewards (points).

### 3. Productivity Tools
- **Live Timer**: Track time spent on specific tasks directly from the UI.
- **Worktime Management**: Aggregation of time spent across all tasks for productivity analytics.

### 4. Communication & Collaboration
- **Direct Messaging**: Chat system for team communication.
- **Inbox/Mail**: Internal notification and mail system.
- **Invitations**: System to invite users to projects and manage memberships.

### 5. Analytics & Gamification
- **Leaderboards**: Ranking users based on motivation and productivity.
- **Experience/Motivation Tracking**: Dynamic scores based on activity and mood.

## Tools & Tech Stack

### Backend
- **Express.js**: Web framework for API development.
- **MongoDB & Mongoose**: NoSQL database and object modeling.
- **JWT**: Secure authentication.
- **Multer**: Handling file uploads (profile pictures, etc.).
- **Node-cron**: Automated tasks (notifications, cleanup).

### Frontend
- **React 19**: Modern UI framework.
- **Vite**: Fast build tool and dev server.
- **SASS**: Advanced styling and theming.
- **Axios**: API communication.
- **Dnd-kit**: Drag-and-drop functionality for Kanban boards.
- **React Router 7**: Client-side routing.

## Services & Architecture

- **RESTful API**: The backend provides a series of endpoints grouped by resource (users, projects, tasks, messages).
- **State Management**: React context/hooks are used for managing authentication and UI state.
- **Cron Services**: Background processes handle:
  - Task due date notifications.
  - Notification cleanup.
- **Real-time potential**: While using REST, the foundation for chat is in place for real-time interaction.

## Completed Milestones
- [x] **Core Backend Architecture**: Express server with robust routing and MongoDB integration.
- [x] **Authentication System**: Fully functional signup, login, and protected routes.
- [x] **Task Management Core**: Full CRUD for tasks, boards, and projects.
- [x] **Timer & Worktime Logic**: Functional task timers that persist to the database.
- [x] **Mood & Motivation Tracking**: Integration of user state into the profile and leaderboard systems.
- [x] **UI Framework**: Responsive layout with Sidebar, Header, and modular page structure.

## Roadmap & Remaining Work

### Near Term
- [ ] **Implementation of the Shop**: A marketplace for exchanging reward points.
- [ ] **Advanced Analytics Dashboard**: Visualizations for worktime and productivity trends.
- [ ] **Mobile Optimization**: Reflowing the complex Kanban boards for mobile devices.

### Long Term
- [ ] **WebSockets**: Transitioning chat to real-time via Socket.io.
- [ ] **Automated Reporting**: Weekly productivity summaries sent via email.
- [ ] **Third-party Integrations**: Sync with Google Calendar or Slack.

## Verification Plan

### Automated Tests
- Run `npm test` in the backend (once implemented) to verify API routes.
- Linting checks using `npm run lint` in the frontend.

### Manual Verification
1. **Auth Flow**: Register a new user, log out, and log back in.
2. **Task Workflow**: Create a project, add a board, add a task, start/stop the timer, and move it to "Done".
3. **Collaboration**: Invite another user to a project and verify they can see the boards.
