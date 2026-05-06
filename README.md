# Hireloom

Hireloom is a full-stack MERN job portal that connects candidates, recruiters, and admins in one hiring workflow. Candidates can build profiles, discover jobs, apply with resumes, and track outcomes. Recruiters can post jobs, review applicants, shortlist or reject candidates, and send updates. Admins can manage users, review platform activity, and control recruiter access.

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- React Router

### Backend
- Node.js
- Express
- MongoDB Atlas
- Mongoose
- JWT authentication
- Multer
- Cloudinary

## Core Roles

### Candidate
- Register and log in
- Complete profile with skills, education, experience, and contact details
- Search and filter jobs
- Save jobs
- View recommended jobs based on skill match
- Apply to jobs with resume upload
- Track applied, shortlisted, and rejected jobs
- Receive notifications

### Recruiter
- Register and log in
- Wait for admin approval
- Post, edit, and delete jobs
- View applicants per job
- View candidate details
- Open candidate resumes
- Shortlist or reject candidates
- Send messages to shortlisted candidates

### Admin
- Log in using manually created admin account
- View all users
- Approve recruiters
- Block or unblock users
- Delete users
- View all jobs
- Delete jobs
- View all applications
- View platform statistics

## Project Structure

```text
Internship_FinalProject/
|-- backend/
|   |-- scripts/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   `-- utils/
|   |-- .env.example
|   `-- server.js
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- pages/
|   |   `-- utils/
|   |-- .env.example
|   `-- vercel.json
`-- render.yaml
```

## Installation and Setup

## 1. Clone the Project

```bash
git clone <your-repository-url>
cd Internship_FinalProject
```

## 2. Install Backend Dependencies

```bash
cd backend
npm install
```

## 3. Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

## 4. Configure Backend Environment Variables

Copy the example file:

```bash
cd backend
copy .env.example .env
```

Update `backend/.env` with real values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

ADMIN_NAME=Admin User
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
```

## 5. Configure Frontend Environment Variables

Copy the example file:

```bash
cd frontend
copy .env.example .env
```

For local development:

```env
VITE_API_URL=http://localhost:5000/api
```

## 6. MongoDB Atlas Setup

1. Create a MongoDB Atlas account.
2. Create a cluster.
3. Create a database user.
4. Add your current IP in Network Access.
5. Copy the MongoDB connection string.
6. Paste it into `MONGO_URI`.

## 7. Cloudinary Setup

1. Create a Cloudinary account.
2. Open the dashboard.
3. Copy:
   - Cloud name
   - API key
   - API secret
4. Paste them into `backend/.env`.
5. In Cloudinary product environment settings, enable PDF delivery if you want resumes to open in the browser.

## 8. Start the Backend

```bash
cd backend
npm run dev
```

Expected:

```text
MongoDB connected
Server running on port 5000
```

Backend URL:

```text
http://localhost:5000
```

Health route:

```text
http://localhost:5000/health
```

## 9. Start the Frontend

```bash
cd frontend
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## 10. Create the Admin User

Since admin registration is not public, create the admin manually:

```bash
cd backend
npm run create-admin
```

Then log in with:
- email from `ADMIN_EMAIL`
- password from `ADMIN_PASSWORD`

## How the Project Works

## Authentication

- Public registration is allowed only for `candidate` and `recruiter`
- Passwords are hashed using bcrypt
- JWT token is generated on login/register
- Token is stored on the frontend session side
- Refreshing the same session keeps login state
- Protected routes check authentication and role

## Candidate Workflow

### Profile
Candidate profile contains:
- skills
- education
- experience
- contact details:
  - phone
  - alternate email

Candidates must complete:
- at least one skill
- at least one education entry

before applying for a job.

### Jobs
Candidate can:
- search jobs by keyword
- filter by location
- filter by skill
- filter by salary range
- save jobs
- open full job details
- apply with resume upload

### Resume Upload
- Resume is uploaded only during job application
- Supported formats:
  - PDF
  - DOC
  - DOCX
- File is stored in Cloudinary
- Recruiters can open the uploaded resume

### AI Job Matching
- Candidate skills are compared with job skills
- Match percentage is calculated
- Recommended jobs are shown based on match

### Dashboard
Candidate dashboard shows:
- applied jobs
- recommended jobs
- shortlisted jobs
- rejected updates
- recently viewed jobs
- profile strength

## Recruiter Workflow

### Approval
- Recruiter account must be approved by admin before posting jobs

### Job Management
Recruiter can:
- create jobs
- edit jobs
- delete jobs
- search and manage posted jobs

Each job includes:
- title
- description
- skills
- salary
- location
- recruiter/company details

### Applicants
Recruiter can:
- view applicants for each job
- open candidate details only when needed
- open candidate resume
- see contact details
- see skill match
- shortlist or reject candidates
- send message notifications to shortlisted candidates

## Admin Workflow

Admin dashboard includes:
- users list
- jobs list
- applications overview
- statistics cards

Admin actions:
- approve recruiter
- block/unblock user
- delete user
- delete job
- monitor applications

Platform statistics include:
- total users
- total jobs
- total applications
- blocked users
- pending recruiters

## Notifications

Notifications are created when:
- a candidate applies for a job
- a recruiter shortlists a candidate
- a recruiter rejects a candidate
- a recruiter sends a message to a shortlisted candidate

## API Overview

### User Routes
- `POST /api/users/register`
- `POST /api/users/login`
- `GET /api/users/profile`
- `GET /api/users/admin`
- `PATCH /api/users/admin/:id/block`
- `PATCH /api/users/admin/:id/approve`
- `DELETE /api/users/admin/:id`

### Profile Routes
- `GET /api/profile/me`
- `PUT /api/profile/me`
- `GET /api/profile/candidates`

### Job Routes
- `GET /api/jobs`
- `GET /api/jobs/:id`
- `GET /api/jobs/matches`
- `POST /api/jobs`
- `PUT /api/jobs/:id`
- `DELETE /api/jobs/:id`
- `GET /api/jobs/admin`
- `GET /api/jobs/admin/stats`

### Application Routes
- `POST /api/applications/jobs/:jobId`
- `GET /api/applications/me`
- `GET /api/applications/recruiter`
- `GET /api/applications/admin`
- `PATCH /api/applications/:id/status`
- `POST /api/applications/:id/message`
- `GET /api/applications/:id/resume`

### Notification Routes
- `GET /api/notifications`
- `PATCH /api/notifications/read`

## Validation and Error Handling

The project includes:
- backend validation for auth, profile, jobs, and applications
- file type and file size validation for resumes
- graceful API error messages on the frontend
- deployment-friendly CORS handling

## Deployment

## Backend on Render

The project includes [render.yaml](render.yaml).

Steps:
1. Push the project to GitHub.
2. Create a Render Web Service.
3. Connect the repo.
4. Use the `backend` folder as the service root.
5. Add environment variables from `backend/.env.example`.
6. Set:
   - `CLIENT_URL=https://your-frontend-domain.vercel.app`
   - `ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app`
7. Deploy.

## Frontend on Vercel

The project includes [frontend/vercel.json](frontend/vercel.json).

Steps:
1. Import the repo into Vercel.
2. Set root directory to `frontend`.
3. Add:

```env
VITE_API_URL=https://your-render-backend.onrender.com/api
```

4. Deploy.

## Troubleshooting

### MongoDB connection issue
- Check `MONGO_URI`
- Check Atlas IP whitelist
- Check database user credentials

### CORS issue
- Check `CLIENT_URL`
- Check `ALLOWED_ORIGINS`
- Make sure frontend domain is included exactly

### Resume not opening
- Ensure PDF delivery is enabled in Cloudinary
- Verify Cloudinary credentials
- Re-upload a fresh resume after fixing configuration

### Recruiter cannot post jobs
- Admin must approve recruiter first

### Candidate cannot apply
- Candidate profile must have skills and education filled

## Final Notes

This project is structured for:
- local development
- portfolio/demo use
- production-style deployment with Render, Vercel, MongoDB Atlas, and Cloudinary

It includes:
- role-based authentication
- profile management
- recruiter workflow
- admin moderation
- notifications
- AI-style job matching
- deployment-ready configuration
