# Unmask Frontend

React SPA for HR-focused candidate credibility analyzer.

## Tech Stack

- React 18
- React Router v6
- Tailwind CSS
- Context API for state management

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will run on `http://localhost:3000` by default.

Note: The app is configured to proxy API requests to `http://localhost:8080` (see `package.json` proxy setting). Make sure your backend is running on that port.

## Project Structure

```
src/
├── api/
│   └── client.js          # API client with auth helpers
├── components/
│   ├── AppLayout.jsx      # Main layout with sidebar and topbar
│   └── RequireAuth.jsx    # Protected route wrapper
├── context/
│   └── AuthContext.js     # Authentication context and hook
├── pages/
│   ├── Login.jsx          # Login page
│   ├── Dashboard.jsx      # Dashboard with stats and candidate table
│   ├── NewCandidate.jsx   # Create new candidate form
│   ├── CandidateDetail.jsx # Candidate details page
│   └── CandidateAnalysis.jsx # Full credibility analysis report
├── App.js                 # Main app component with routing
├── index.js               # Entry point
└── index.css              # Global styles with Tailwind
```

## Features

- **Authentication**: JWT-based auth with context API
- **Protected Routes**: All pages except login require authentication
- **Responsive Design**: Mobile-friendly with collapsible sidebar
- **Modern UI**: Glassmorphism design with indigo/purple gradients
- **Error Handling**: Graceful error states throughout the app

## API Endpoints Used

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (not implemented in UI)
- `POST /api/candidates` - Create new candidate
- `GET /api/candidates` - List all candidates (optional, dashboard handles missing endpoint)
- `GET /api/candidates/:id` - Get candidate details
- `GET /api/candidates/:id/analysis` - Get candidate analysis
- `DELETE /api/candidates/:id` - Delete candidate

## Styling

The app uses Tailwind CSS with custom utilities:
- `.glass-card` - Glassmorphism card style
- `.btn-primary` - Primary button (indigo)
- `.btn-danger` - Danger button (rose)
- `.btn-secondary` - Secondary button (slate)

Color scheme:
- Background: `slate-950` to `slate-900` with indigo accents
- Primary: Indigo-500/600
- Danger: Rose-500/600
- Success: Green-500/600

