# Worklog - Modern Time Tracking Application

A production-ready worklog application built with React, TypeScript, and Encore.ts backend. Features organization management, team collaboration, and comprehensive time tracking capabilities.

## Features

- **Organization Management**: Create or join organizations with role-based access control
- **Team Collaboration**: Invite team members, manage permissions, and approve join requests
- **Time Tracking**: Intuitive time entry with project-based organization
- **Admin Dashboard**: Comprehensive analytics, user management, and project oversight
- **Real-time Updates**: Live synchronization across team members
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Architecture

### Backend (Encore.ts)
- **Database Service**: PostgreSQL with comprehensive schema for organizations, users, projects, and time entries
- **Auth Service**: User authentication and organization management
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
- PostgreSQL database
- Encore CLI

### Backend Setup

1. **Install Encore CLI**:
```bash
curl -L https://encore.dev/install.sh | bash
```

2. **Initialize the backend**:
```bash
encore app create worklog-backend
cd worklog-backend
```

3. **Set up the database**:
The database will be automatically created when you run the application. The migration files define the complete schema.

4. **Run the backend**:
```bash
encore run
```

The backend will be available at `http://localhost:4000`

### Frontend Setup

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Configure API endpoint**:
Update `frontend/config.ts` with your backend URL:
```typescript
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-app.encr.app' 
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

## Deployment

### Backend Deployment (Encore.ts)
```bash
encore deploy --env production
```

### Frontend Deployment

#### Netlify
1. Build the application: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Update `API_BASE_URL` in config

#### Vercel
1. Connect your repository to Vercel
2. Deploy with default settings
3. Update environment variables

## Development

### Project Structure
```
backend/
├── auth/              # Authentication service
├── database/          # Database service and migrations
├── organizations/     # Organization management
├── projects/          # Project management
└── time-entries/      # Time tracking

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
- **Backend**: Encore.ts, PostgreSQL, TypeScript
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
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

Built with ❤️ using Encore.ts and React
