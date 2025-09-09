# JIRA Worklog Viewer - OAuth Setup Guide

This application now supports both **Atlassian OAuth** and **API Token** authentication methods.

## 🔐 Authentication Methods

### 1. Atlassian OAuth (Recommended)

- Secure OAuth 2.0 flow
- No need to manage API tokens
- Access to multiple Jira sites
- Automatic token refresh

### 2. API Token (Legacy)

- Direct authentication with email + API token
- Works with single Jira instance
- Manual token management required

## 🚀 Setup Instructions

### Step 1: Create Atlassian OAuth App

1. **Go to Atlassian Developer Console**

   - Visit: https://developer.atlassian.com/console/myapps/
   - Sign in with your Atlassian account

2. **Create a new app**

   - Click "Create" → "OAuth 2.0 integration"
   - Enter your app name: "JIRA Worklog Viewer"
   - Select your workspace

3. **Configure OAuth 2.0 settings**

   - **App name**: JIRA Worklog Viewer
   - **Logo**: Upload your logo (optional)
   - **App description**: View and manage JIRA worklogs with ease

4. **Set Authorization callback URL**

   ```
   http://localhost:3000/api/auth/callback/atlassian
   ```

   **For production**, use your domain:

   ```
   https://yourdomain.com/api/auth/callback/atlassian
   ```

5. **Configure Permissions (Scopes)**
   Add these scopes to your app:

   ```
   read:jira-work
   read:jira-user
   offline_access
   ```

6. **Get your credentials**
   - Copy your **Client ID**
   - Copy your **Client Secret**
   - Save these for the next step

### Step 2: Environment Variables

1. **Copy the example environment file**

   ```bash
   cp .env.example .env.local
   ```

2. **Update `.env.local` with your credentials**

   ```env
   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-super-secret-key-min-32-characters

   # Atlassian OAuth Configuration
   ATLASSIAN_CLIENT_ID=your-client-id-from-step-1
   ATLASSIAN_CLIENT_SECRET=your-client-secret-from-step-1

   # Optional: Default JIRA Site URL (for API token method)
   NEXT_PUBLIC_JIRA_SITE_URL=https://your-domain.atlassian.net
   ```

3. **Generate NEXTAUTH_SECRET**
   ```bash
   openssl rand -base64 32
   ```
   Or use: https://generate-secret.vercel.app/32

### Step 3: Install Dependencies & Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit http://localhost:3000 to see your app!

## 🔧 Atlassian Developer Console Configuration

### Required URLs in your Atlassian OAuth App:

| Environment | Callback URL                                         |
| ----------- | ---------------------------------------------------- |
| Development | `http://localhost:3000/api/auth/callback/atlassian`  |
| Production  | `https://yourdomain.com/api/auth/callback/atlassian` |

### Required Scopes:

| Scope            | Description                                 |
| ---------------- | ------------------------------------------- |
| `read:jira-work` | Read worklogs, time tracking, and work data |
| `read:jira-user` | Read user profile information               |
| `offline_access` | Refresh tokens for long-term access         |

### Additional Settings:

1. **Distribution**: Keep as "Private" for internal use
2. **Data residency**: Select your preferred region
3. **Granular scopes**: Enable for better permission control

## 🏢 For Production Deployment

### 1. Update Environment Variables

```env
NEXTAUTH_URL=https://yourdomain.com
```

### 2. Update Atlassian OAuth App

- Add production callback URL
- Update privacy policy and terms of service URLs (if required)

### 3. Deployment Platforms

#### Vercel

```bash
vercel env add NEXTAUTH_SECRET
vercel env add ATLASSIAN_CLIENT_ID
vercel env add ATLASSIAN_CLIENT_SECRET
vercel env add NEXTAUTH_URL
```

#### Netlify

Add environment variables in Site Settings → Environment Variables

#### Other platforms

Refer to your platform's documentation for setting environment variables.

## 🔍 Troubleshooting

### Common Issues:

1. **"Invalid client" error**

   - Check that `ATLASSIAN_CLIENT_ID` and `ATLASSIAN_CLIENT_SECRET` are correct
   - Ensure callback URL matches exactly (including http/https)

2. **"Scope not granted" error**

   - Verify all required scopes are added in Atlassian Developer Console
   - Re-authorize the application

3. **"No accessible sites" after OAuth login**

   - User needs access to at least one Jira site
   - Check Jira permissions for the user

4. **Session issues**
   - Ensure `NEXTAUTH_SECRET` is set and at least 32 characters
   - Clear browser cookies and try again

### Debug Mode:

Add to `.env.local` for detailed logging:

```env
NEXTAUTH_DEBUG=true
```

## 📚 API Endpoints

| Endpoint                  | Method   | Description                       |
| ------------------------- | -------- | --------------------------------- |
| `/api/auth/[...nextauth]` | GET/POST | NextAuth.js OAuth handling        |
| `/api/oauth/sites`        | POST     | Fetch accessible Jira sites       |
| `/api/auth`               | POST     | API token authentication (legacy) |

## 🔗 Useful Links

- [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Atlassian OAuth 2.0 Guide](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/)
- [JIRA REST API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)

## 🎯 Features

✅ **Dual Authentication**: OAuth + API Token  
✅ **Multi-site Support**: Access multiple Jira instances  
✅ **Secure Token Handling**: Automatic refresh and storage  
✅ **Responsive Design**: Works on desktop and mobile  
✅ **Real-time Data**: Live worklog updates  
✅ **Advanced Analytics**: Productivity insights and charts
