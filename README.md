# Worklog - Modern Time Tracking Application

A production-ready worklog application built with React, TypeScript, and Supabase. Features organization management, team collaboration, and comprehensive time tracking capabilities.

## Features

- **User Authentication**: Secure sign-up/sign-in with Supabase Auth
- **Organization Management**: Create or join organizations with role-based access control
- **Team Collaboration**: Invite team members, manage permissions, and approve join requests
- **Time Tracking**: Intuitive time entry with project-based organization
- **Admin Dashboard**: Comprehensive analytics, user management, and project oversight
- **Real-time Updates**: Live synchronization across team members
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Architecture

### Frontend (React + TypeScript)
- **Modern React**: Hooks-based architecture with TypeScript
- **Tailwind CSS**: Utility-first styling with shadcn/ui components
- **Supabase Client**: Direct integration with Supabase for real-time data
- **Responsive Design**: Mobile-first approach with consistent UX

### Backend (Supabase)
- **PostgreSQL Database**: Robust relational database with Row Level Security
- **Authentication**: Built-in user management and session handling
- **Real-time Subscriptions**: Live updates across clients
- **Edge Functions**: Serverless functions for complex operations
- **Storage**: File uploads and management

## Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase account
- npm or yarn

### Supabase Setup

1. **Create a Supabase project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **Set up the database**:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase-setup.sql`
   - Run the SQL to create all tables, functions, and policies

3. **Configure Authentication**:
   - Go to Authentication > Settings in your Supabase dashboard
   - Enable email authentication
   - Configure your site URL (e.g., `http://localhost:5173` for development)

### Frontend Setup

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Environment configuration**:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Run the application**:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Supabase Configuration Checklist

### 1. Database Setup
- [x] Run the `supabase-setup.sql` script in SQL Editor
- [x] Verify all tables are created with proper relationships
- [x] Check that Row Level Security policies are enabled
- [x] Confirm triggers and functions are working

### 2. Authentication Setup
- [x] Enable Email authentication in Auth settings
- [x] Set site URL to your domain (localhost for development)
- [x] Configure email templates (optional)
- [x] Set up redirect URLs for production

### 3. API Settings
- [x] Note your Project URL from Settings > API
- [x] Copy your anon/public key from Settings > API
- [x] Ensure RLS is enabled on all tables
- [x] Test API access with the anon key

### 4. Security Configuration
- [x] Review RLS policies for each table
- [x] Test that users can only access their organization's data
- [x] Verify admin-only operations are properly protected
- [x] Check that sensitive data is not exposed

## Database Schema

### Core Tables
- **organizations**: Organization details and settings
- **user_profiles**: Extended user information (linked to auth.users)
- **organization_members**: User-organization relationships with roles
- **projects**: Project information within organizations
- **time_entries**: Individual time tracking records
- **invitations**: Email invitations for joining organizations

### Key Features
- **Row Level Security**: Complete data isolation between organizations
- **Role-based Access**: Admin and member roles with appropriate permissions
- **Invitation System**: Secure token-based invitations with expiration
- **Automatic Profile Creation**: Triggers create user profiles on signup
- **Audit Trail**: Comprehensive tracking of user actions

## Usage Guide

### First Time Setup

1. **Sign Up**: Create an account with email and password
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

## Security Features

- **Row Level Security**: Complete data isolation between organizations
- **Role-based Access**: Granular permissions for different user types
- **Secure Invitations**: Token-based invitations with expiration
- **Input Validation**: Comprehensive validation on all inputs
- **SQL Injection Protection**: Parameterized queries throughout
- **Authentication**: Secure JWT-based authentication via Supabase

## Deployment

### Frontend Deployment

#### Netlify
1. Build the application: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Set environment variables in Netlify dashboard
4. Update Supabase site URL to your production domain

#### Vercel
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with default settings
4. Update Supabase site URL to your production domain

### Supabase Configuration for Production

1. **Update Site URL**: Set your production domain in Auth settings
2. **Configure Email Templates**: Customize email templates for your brand
3. **Set up Custom Domain**: Optional custom domain for Supabase
4. **Review Security Settings**: Ensure all security policies are production-ready

## Development

### Project Structure
```
frontend/
├── components/        # React components
│   ├── auth/         # Authentication components
│   ├── admin/        # Admin panel components
│   ├── dashboard/    # Dashboard components
│   └── layout/       # Layout components
├── hooks/            # Custom React hooks
├── lib/              # Supabase client and utilities
├── utils/            # Utility functions
└── types.ts          # TypeScript definitions

supabase-setup.sql    # Database schema and setup
```

### Key Technologies
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime

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
- Check Supabase documentation for database/auth issues
- Open an issue for bugs or feature requests

---

Built with ❤️ using Supabase and React
