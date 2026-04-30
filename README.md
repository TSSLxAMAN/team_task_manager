# TeamFlow

> A full-stack team task manager built for engineering teams — with GitHub-style branch names, a visual task graph, role-based access, and a built-in work timer.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Seed Demo Data](#seed-demo-data)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Roles & Permissions](#roles--permissions)
- [Task Lifecycle](#task-lifecycle)
- [Task Graph View](#task-graph-view)
- [Demo Credentials](#demo-credentials)
- [Deployment](#deployment)

---

## Overview

TeamFlow is a project and task management platform built as a campus placement assignment for **Ethara AI**. It is designed around how engineering teams actually work — tasks auto-generate Git branch names, members submit MR links on completion, admins review and close or send back work, and everyone can see the project tree grow in a live graph view.

The UI follows the **Claude design system** — warm cream backgrounds, amber accents, Inter + JetBrains Mono typography, and full light/dark mode support.

---

## Features

### Authentication
- Email + password login and registration via JWT
- Access token auto-refresh on 401 (Axios interceptor)
- Tokens stored in `localStorage`, cleared on logout

### Role-Based Access
| Capability | Admin | Member |
|---|:---:|:---:|
| Create / edit projects | ✓ | |
| Add / remove project members | ✓ | |
| Create tasks | ✓ | |
| Start a task | ✓ | ✓ (if assigned) |
| Submit task for review | | ✓ (if assigned) |
| Close task (mark done) | ✓ | |
| Send task back with reason | ✓ | |
| View task graph | ✓ | ✓ |
| Filter graph by assignee / status | ✓ | |
| Click task card to open detail | ✓ | |

### Project Management
- Create colour-coded projects with descriptions
- Per-project member management — admin picks members from a user picker modal
- Live progress bar + task-count breakdown by status

### Task Management
- Auto-incremented task numbers per project (`#1`, `#2`, …)
- Auto-generated Git branch names — `feature/3-fix-login-bug`
- Priority levels: **High · Medium · Low**
- Due dates with overdue highlighting
- Parent / subtask hierarchy (unlimited nesting)
- Assign tasks to project members

### Built-in Work Timer
- Members start their timer when they begin a task
- Timer runs in-browser with pause/resume support
- Elapsed time is submitted along with the MR link

### Review Workflow
- Member submits MR link + completion notes → status becomes **Under Review**
- Admin closes (→ **Done**) or sends back with a reason (→ **Sent Back**)
- Dedicated **Review Queue** page for admins

### Task Graph View
- Zoomable, pannable infinite canvas (scroll-wheel zoom, click-drag pan)
- **Inverted tree layout** — main tasks form a vertical spine; subtasks branch left/right; sub-subtasks stack below their parent
- Bezier curves for branches, dashed lines for stacked children
- Dot-grid background that moves with the camera
- Stat cards at the top act as quick status filters (admin only)
- Admin can click any node to open full task detail
- Admin can add a task or subtask directly from any node's `+` button

### Dashboard
- Aggregate stats across all projects
- Recent activity
- Quick-links to in-progress tasks

---

## Tech Stack

### Frontend
| Library | Purpose |
|---|---|
| React 18 | UI framework |
| React Router DOM v6 | Client-side routing |
| Redux Toolkit | Global state (auth, projects, tasks) |
| Axios | HTTP client with JWT interceptor |
| Vite | Build tool |
| Lucide React | Icon set |
| Sonner | Toast notifications |
| Radix UI | Accessible headless components |
| Tailwind CSS | Utility classes (design tokens via CSS vars) |
| date-fns | Date formatting |

### Backend
| Library | Purpose |
|---|---|
| Django 5.0 | Web framework |
| Django REST Framework | REST API |
| dj-rest-auth | Auth endpoints (login / register / logout) |
| django-allauth | Account management |
| djangorestframework-simplejwt | JWT token issuance |
| django-cors-headers | CORS for the React dev server |
| django-filter | Query-param filtering |
| python-slugify | Branch name generation |
| WhiteNoise | Static file serving |
| Gunicorn | WSGI server for production |
| dj-database-url | `DATABASE_URL` parsing for Render |
| psycopg2-binary | PostgreSQL adapter |

### Database
- **PostgreSQL** (local dev + Render cloud)

---

## Project Structure

```
team_task_manager/
├── backend/
│   ├── core/                  # Django settings, root URLs, WSGI
│   ├── accounts/              # Custom User model, auth serializers/views
│   ├── projects/              # Project model, member management
│   ├── tasks/                 # Task model, status transitions, timer
│   │   └── management/
│   │       └── commands/
│   │           └── seed.py    # Demo data seeder
│   ├── requirements.txt
│   ├── Procfile               # Gunicorn entry point for Render
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── components/        # Avatar, Badges, BranchChip, Modal, Sidebar …
    │   ├── lib/               # api.js (Axios instance), utils.js
    │   ├── pages/             # Dashboard, Projects, ProjectDetail,
    │   │                      #   TaskDetail, MyTasks, ReviewQueue, TaskGraph
    │   ├── store/             # authSlice, projectSlice, taskSlice
    │   ├── App.jsx            # Router, AppShell, ProtectedRoute
    │   ├── main.jsx
    │   └── index.css          # Design tokens (CSS variables, animations)
    ├── package.json
    └── vite.config.js
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ running locally

### Backend Setup

```bash
# 1. Create and activate a virtual environment
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create the .env file (see Environment Variables section)
cp .env.example .env
# Edit .env with your DB credentials

# 4. Create the PostgreSQL database
psql -U postgres -c "CREATE DATABASE teamflow;"

# 5. Run migrations
python manage.py migrate

# 6. Start the dev server
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`.

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Create the .env file
cp .env.example .env
# VITE_API_URL=http://localhost:8000/api

# 3. Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Seed Demo Data

Populate the database with realistic demo data covering all task statuses, subtask hierarchies, and multiple projects:

```bash
cd backend
python manage.py seed
```

To wipe everything and start fresh:

```bash
python manage.py seed --flush
```

---

## Environment Variables

### Backend — `backend/.env`

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=teamflow
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Optional — overrides individual DB_* vars (used on Render)
# DATABASE_URL=postgresql://user:pass@host/db
```

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:8000/api
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login/` | Login → returns `access` + `refresh` tokens |
| `POST` | `/api/auth/registration/` | Register new user |
| `POST` | `/api/auth/logout/` | Logout |
| `GET` | `/api/auth/user/` | Get current user |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects/` | List all accessible projects |
| `POST` | `/api/projects/` | Create project (admin) |
| `GET` | `/api/projects/:id/` | Project detail + stats |
| `PATCH` | `/api/projects/:id/` | Update project (admin) |
| `DELETE` | `/api/projects/:id/` | Delete project (admin) |
| `POST` | `/api/projects/:id/members/` | Add member by email (admin) |
| `DELETE` | `/api/projects/:id/members/:userId/` | Remove member (admin) |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects/:id/tasks/` | List project tasks (top-level + nested subtasks) |
| `POST` | `/api/projects/:id/tasks/` | Create task (admin) |
| `GET` | `/api/tasks/:id/` | Task detail |
| `PATCH` | `/api/tasks/:id/start/` | Start task → `in_progress` |
| `PATCH` | `/api/tasks/:id/submit/` | Submit for review → `under_review` |
| `PATCH` | `/api/tasks/:id/close/` | Close task → `done` (admin) |
| `PATCH` | `/api/tasks/:id/reopen/` | Send back → `sent_back` (admin) |
| `GET` | `/api/tasks/review-queue/` | All under-review tasks (admin) |
| `GET` | `/api/tasks/my-tasks/` | Tasks assigned to current user |

### Users
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/` | List all users (admin) |

---

## Roles & Permissions

TeamFlow has two global roles set at registration:

**Admin**
- Full CRUD on projects and tasks
- Adds/removes project members
- Reviews submitted work — closes or sends back with feedback
- Sees all tasks across all projects
- Accesses the Review Queue and all graph filters

**Member**
- Sees only projects they are added to
- Starts and submits their assigned tasks
- Submits MR link + timer + completion notes on finish
- Views the task graph (read-only, no filters, no click-through)

---

## Task Lifecycle

```
          Admin creates task
                 │
              [ TODO ]
                 │
         Member clicks Start
                 │
           [ IN PROGRESS ]  ◄─────────────────┐
                 │                             │
         Member submits MR link               │
                 │                             │
          [ UNDER REVIEW ]                    │
                 │                             │
        ┌────────┴────────┐                   │
        │                 │                   │
  Admin closes      Admin sends back          │
        │            (with reason)            │
     [ DONE ]        [ SENT BACK ] ───────────┘
                    Member re-starts
```

Each task auto-generates a branch name on creation:

```
feature/7-implement-dark-mode
```

---

## Task Graph View

The graph page (`/graph`) renders the entire project as a live, navigable tree:

```
                  ● App Redesign
                       │
         ┌─────────────┤
         │             │
   Auth docs      Fix login bug      API docs
   (TODO)         (IN PROGRESS)      (TODO)
         │                          /        \
   Tasks endpoint             Auth section   Rate limiting
   docs (TODO)                docs (TODO)    docs (TODO)
```

- **Scroll wheel** — zoom in / out
- **Click + drag** on the background — pan
- **Reset button** — return to default zoom and position
- **`+` on project node** — add a new top-level task (admin)
- **`+` on task node** — add a subtask to that node (admin)
- **Click task node** — open full task detail (admin only)

---

## Demo Credentials

After running `python manage.py seed`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@teamflow.com` | `admin1234` |
| Member | `aman@teamflow.com` | `test1234` |
| Member | `priya@teamflow.com` | `test1234` |
| Member | `maya@teamflow.com` | `test1234` |
| Member | `arjun@teamflow.com` | `test1234` |

The seed creates **3 projects** and **25 tasks** covering every status, subtask nesting, overdue dates, MR links, send-back reasons, and in-progress timers.

---

## Deployment

### Backend — Render Web Service

1. Push the `backend/` directory to a GitHub repository
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set the build command:
   ```
   pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --no-input
   ```
4. Set the start command:
   ```
   gunicorn core.wsgi:application
   ```
5. Add environment variables in the Render dashboard:
   ```
   SECRET_KEY=...
   DEBUG=False
   ALLOWED_HOSTS=your-app.onrender.com
   DATABASE_URL=postgresql://...   ← from Render PostgreSQL
   CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```

### Frontend — Vercel / Render Static Site

```bash
npm run build        # outputs to dist/
```

Deploy the `dist/` folder as a static site. Set the environment variable:

```
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## Built With

This project was built as a placement assignment for **Ethara AI** by **Aman Kumar** (B.Tech CSE, Integral University — 2026 batch).

---

*TeamFlow — built to grow with your team.*
