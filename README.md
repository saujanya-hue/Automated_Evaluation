# AI-Powered Automated Answer Script Evaluation System

An enterprise-scale automated grading and script audit platform for universities. The application utilizes a FastAPI backend running three **LangGraph AI agents** powered by **Ollama (gpt-oss:120b-cloud)** OCR & Evaluation engine, connected to a multi-portal **React 19 + TypeScript + Tailwind CSS** frontend dashboard.

---

## 📂 Project Architecture & Codebase Directory

```
answer_script/
├── backend/
│   ├── requirements.txt            # Python dependencies (FastAPI, SQLAlchemy, PyJWT, openpyxl, reportlab)
│   └── app/
│       ├── main.py                 # FastAPI application core, CORS configuration, and db seeding router
│       ├── database/
│       │   └── session.py          # SQLAlchemy session engine & sqlite connection fallback configuration
│       ├── core/
│       │   └── security.py         # Passlib password hashing and PyJWT token generation
│       ├── models/
│       │   └── models.py           # Relational schema mappings (User, Student, Subject, Exam, Answers, OCR, Complaints)
│       ├── schemas/
│       │   └── schemas.py          # Data validation schemas using Pydantic
│       ├── api/
│       │   ├── dependencies.py     # Auth extraction middlewares & RBAC role-level checking
│       │   ├── auth.py             # Signup and token issuance endpoints
│       │   ├── admin_api.py        # Admin portal stats indicators and complete course configurations CRUDs
│       │   ├── faculty_api.py      # Exam creation, background OCR/grading tasks launcher, overrides, complaints review
│       │   └── student_api.py      # Result auditing, OCR side-by-side inspector, and complaint desk ticket creator
│       └── agents/
│           └── agents.py           # LangGraph-compatible state workflow (OCR, Ollama evaluation, report builder)
└── frontend/
    ├── package.json                # Node modules (React 19, Vite, Tailwind CSS, Lucide, Recharts, Framer Motion)
    ├── vite.config.ts              # Vite compiler configuration
    ├── tsconfig.json               # TypeScript compiler rules
    ├── tailwind.config.js          # Tailwind dark-mode-first slate variables configuration
    ├── index.html                  # HTML entry loading Outfit fonts
    └── src/
        ├── main.tsx                # React app mount bootstrap
        ├── App.tsx                 # Client routers, nested paths, and guards mapping
        ├── index.css               # Core styling tokens, custom scrollbars, and timeline styles
        ├── contexts/
        │   └── AuthContext.tsx     # Session persistent context, dark mode handler, and toast overlay
        ├── services/
        │   └── api.ts              # Axios interceptors appending token headers and API wrappers
        ├── components/
        │   ├── Sidebar.tsx         # Responsive navbar generating links dynamically by role
        │   └── TopNav.tsx          # Page breadcrumbs, searches, and alerts popover
        ├── layouts/
        │   ├── AdminLayout.tsx     # Admin route guard
        │   ├── FacultyLayout.tsx   # Faculty route guard
        │   └── StudentLayout.tsx   # Student route guard
        └── pages/
            ├── Login.tsx           # Authentication page with custom theme and one-click database seeder
            ├── AdminDashboard.tsx  # Admin statistics grid
            ├── AdminFaculty.tsx    # Faculty management CRUD and search
            ├── AdminStudents.tsx   # Student enrolment grids and search
            ├── AdminCurriculum.tsx # Tabbed interface managing Departments, Classes, and Faculty Assignments
            ├── FacultyDashboard.tsx# Faculty subjects overview card grid
            ├── FacultyExams.tsx    # Exam configurations and files uploader
            ├── FacultyEvaluation.tsx# Animated AI processing timeline, script browser, and grading overrides
            ├── FacultyAnalytics.tsx# Recharts visual charts for averages, pass rates, and top performers
            ├── FacultyComplaints.tsx# Re-evaluation request resolving board
            ├── StudentDashboard.tsx# Student semester results tracking dashboard
            ├── StudentResults.tsx  # Graded scripts reviewer (Scanned PDF vs. OCR text) and complaints desk
            ├── StudentComplaints.tsx# Submitted complaints tracker
            └── StudentDownloads.tsx# JavaScript Blob transcript exporter and scanned files compiler
```

---

## 🛠️ Implemented Modules

### 1. Database & Persistence Layer (`backend/app/database/` & `models/`)
* **SQLAlchemy ORM**: Configured a schema with primary relationships, foreign keys, and cascade deletes.
* **Auto DB Generation**: The server automatically initializes tables at launch time.
* **SQLite Fallback**: Falls back automatically to a local SQLite database (`answer_evaluation.db`) to enable testing without configuring a local PostgreSQL instance first.

### 2. Security & RBAC Auth (`backend/app/core/` & `api/dependencies.py`)
* **JWT Authentication**: Protects endpoints using Bearer token verification.
* **Role-Based Access Control**: Decorators and dependency checking blocks unauthorized users from hitting endpoints belonging to other portals.

### 3. LangGraph AI Agent Workflow (`backend/app/agents/`)
* **Agent 1: Document Understanding Node**: Connects to Ollama (`gpt-oss:120b-cloud`) vision engine. Submits scanned sheets, extracts handwriting transcripts, segments pages, and structures mapped answers into JSON.
* **Agent 2: Evaluation Node**: Invokes Ollama `gpt-oss:120b-cloud` model to grade answers based on correctness, clarity, relevance, and completeness, producing feedback and grading confidence scores.
* **Agent 3: Analytics Node**: Compiles overall grades, averages confidence scores, and persists final marks and OCR data into relational tables.
* *Note: Robust fallback simulators run if local Ollama model instance is unreachable.*

### 4. React Single Page Web Application (`frontend/src/`)
* **Design Aesthetic**: Premium glassmorphism styles, glowing gradients, rounded corners, custom scrollbars, animated timelines, and dynamic Recharts graphs.
* **Role Routing Guards**: Implemented nested route guards redirecting unauthorized accounts out of protected dashboard paths.
* **Axios Interceptor**: Automatically attaches the JWT bearer tokens to all request headers.

---

## ⚡ Execution Instructions

Follow these steps to run and test both the backend and frontend systems locally on your system:

### Step 1: Start the FastAPI Backend Server
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install all required python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Launch the development server using the runner script:
   ```bash
   python run_server.py
   ```
* The API endpoints will be live at: [http://localhost:8002](http://localhost:8002)
* Interactive Swagger documentation will be accessible at: [http://localhost:8002/docs](http://localhost:8002/docs)

---

### Step 2: Start the React Frontend Dev Server
1. Navigate to the `frontend` folder in a new terminal window:
   ```bash
   cd frontend
   ```
2. Install the required Node packages:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
* The application UI will be accessible in your web browser at: [http://localhost:3000](http://localhost:3000)

---

### Step 3: Seed and Play in the Sandbox
1. Open the login page at [http://localhost:3000/login](http://localhost:3000/login).
2. Click the **Setup Demo** button at the bottom of the card. This calls the `/api/seed` database script on the backend, initializing sample records for classes, departments, subjects, students, faculty, exams, answer scripts, AI grading logs, and complaints.
3. Click the **Admin**, **Faculty**, or **Student** buttons to auto-populate credentials and explore each layout immediately:
   * **Admin Account**: `admin@university.edu` / `admin123`
   * **Faculty Account**: `faculty@university.edu` / `faculty123`
   * **Student Account**: `student@university.edu` / `student123`
