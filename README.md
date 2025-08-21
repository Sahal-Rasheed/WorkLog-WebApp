# Worklog - Modern Time Tracking Application

A production-ready worklog application built with React, TypeScript, and Supabase backend. Features organization management, team collaboration, and comprehensive time tracking capabilities.

## Features

- **Organization Management**: Create or join organizations with role-based access control
- **Team Collaboration**: Invite team members, manage permissions, and approve join requests
- **Time Tracking**: Intuitive time entry with project-based organization
- **Admin Dashboard**: Comprehensive analytics, user management, and project oversight
- **Real-time Updates**: Live synchronization across team members
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Architecture

### Backend (Node.js + Supabase)
- **Express.js API**: RESTful API with proper CORS handling
- **Supabase Database**: PostgreSQL with comprehensive schema for organizations, users, projects, and time entries
- **Authentication**: Simple email/name based authentication
- **Organizations Service**: Organization creation, joining, and member management
- **Projects Service**: Project management within organizations
- **Time Entries Service**: CRUD operations for time tracking

### Frontend (React + TypeScript)
- **Modern React**: Hooks-based architecture with TypeScript
- **Tailwind CSS**: Utility-first styling with shadcn/ui components
- **Responsive Design**: Mobile-first approach with consistent UX
- **State Management**: Context-based auth and organization state

## Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase account
- npm or yarn

### Supabase Setup

1. **Create a Supabase project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and API keys

2. **Set up the database**:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `backend/supabase-schema.sql`
   - Run the SQL to create all tables and indexes

3. **Configure Row Level Security**:
   - The schema includes RLS policies for the service role
   - This allows the backend to access all data securely

### Backend Setup

1. **Install dependencies**:
```bash
cd backend
npm install
```

2. **Environment configuration**:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=4000
NODE_ENV=development
```

3. **Run the backend**:
```bash
npm run dev
```

The backend will be available at `http://localhost:4000`

### Frontend Setup

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Configure API endpoint**:
Update `frontend/config.ts` if needed (defaults to localhost:4000):
```typescript
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com' 
  : 'http://localhost:4000';
```

3. **Run the frontend**:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage Guide

### First Time Setup

1. **Sign Up**: Enter your email and name to create an account
2. **Organization Choice**: 
   - Create a new organization if you're starting fresh
   - Join an existing organization if you have an invitation
   - Request to join suggested organizations based on your email domain
3. **Start Tracking**: Begin logging time entries for your projects

### For Administrators

1. **Project Management**: Create and manage projects for your organization
2. **User Management**: 
   - Invite team members via email
   - Approve join requests from users
   - Manage user roles (admin/member)
3. **Analytics**: View comprehensive stats on team performance and project allocation

### For Team Members

1. **Time Tracking**: Log daily time entries with project and task details
2. **Dashboard**: View personal statistics and time summaries
3. **Project Selection**: Work across multiple projects within your organization

## Database Schema

### Core Tables
- **organizations**: Organization details and settings
- **users**: User profiles and authentication data
- **organization_members**: User-organization relationships with roles
- **projects**: Project information within organizations
- **time_entries**: Individual time tracking records
- **invitations**: Email invitations for joining organizations

### Key Features
- **Role-based Access**: Admin and member roles with appropriate permissions
- **Invitation System**: Secure token-based invitations with expiration
- **Data Isolation**: Complete separation between organizations
- **Audit Trail**: Comprehensive tracking of user actions

## API Endpoints

### Authentication
- `POST /auth/login` - User login/registration
- `POST /auth/check-email` - Check for existing accounts and invitations

### Organizations
- `POST /organizations` - Create new organization
- `POST /organizations/join` - Request to join organization
- `POST /organizations/accept-invitation` - Accept invitation
- `GET /organizations/:id/members` - Get organization members
- `POST /organizations/:id/members/:memberId/approve` - Approve member
- `POST /organizations/:id/invite` - Invite user

### Projects
- `GET /organizations/:id/projects` - List projects
- `POST /organizations/:id/projects` - Create project

### Time Entries
- `GET /organizations/:id/time-entries` - List time entries (with filters)
- `POST /organizations/:id/time-entries` - Create time entry
- `PUT /organizations/:id/time-entries/:entryId` - Update time entry
- `DELETE /organizations/:id/time-entries/:entryId` - Delete time entry

## Security Features

- **Data Isolation**: Complete separation between organizations
- **Role-based Access**: Granular permissions for different user types
- **Secure Invitations**: Token-based invitations with expiration
- **Input Validation**: Comprehensive validation on all inputs
- **SQL Injection Protection**: Parameterized queries throughout
- **CORS Protection**: Proper CORS configuration for frontend access

## Deployment

### Backend Deployment

#### Railway/Render/Heroku
1. Connect your repository
2. Set environment variables from your `.env` file
3. Deploy with default Node.js settings

#### Manual VPS
1. Install Node.js and PM2
2. Clone repository and install dependencies
3. Set environment variables
4. Start with PM2: `pm2 start server.js`

### Frontend Deployment

#### Netlify
1. Build the application: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Update `API_BASE_URL` in config for production

#### Vercel
1. Connect your repository to Vercel
2. Deploy with default settings
3. Update environment variables if needed

## Development

### Project Structure
```
backend/
├── config/            # Supabase configuration
├── routes/            # API route handlers
│   ├── auth.js       # Authentication routes
│   ├── organizations.js # Organization management
│   ├── projects.js   # Project management
│   └── timeEntries.js # Time tracking
├── server.js         # Express server setup
└── supabase-schema.sql # Database schema

frontend/
├── components/        # React components
│   ├── auth/         # Authentication components
│   ├── admin/        # Admin panel components
│   ├── dashboard/    # Dashboard components
│   └── layout/       # Layout components
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
└── types.ts          # TypeScript definitions
```

### Key Technologies
- **Backend**: Node.js, Express.js, Supabase, PostgreSQL
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Validation**: Custom validation utilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Check the documentation above
- Review the code comments for implementation details
- Open an issue for bugs or feature requests

---

Built with ❤️ using Supabase and React
