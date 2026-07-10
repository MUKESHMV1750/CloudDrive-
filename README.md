# CloudDrive — Google Drive Clone

A full-featured Google Drive–style file management app built with **HTML, CSS, JavaScript** (frontend) and **Supabase** (backend).

---

## 🚀 Quick Setup

### Step 1 — Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** and fill in the details
3. Wait for the project to be ready (~2 min)

### Step 2 — Get Your API Keys
1. In your Supabase project → **Settings** → **API**
2. Copy:
   - **Project URL** (e.g. `https://xxxx.supabase.co`)
   - **Anon public key**

### Step 3 — Configure the App
Open `js/supabase.js` and replace the placeholders:
```js
const SUPABASE_URL  = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON = 'YOUR_ANON_KEY_HERE';
```

### Step 4 — Run Database Schema
1. In Supabase → **SQL Editor** → **New Query**
2. Paste the contents of `database/schema.sql` → **Run**
3. Paste the contents of `database/policies.sql` → **Run**

### Step 5 — Create Storage Bucket
1. In Supabase → **Storage** → **New Bucket**
2. Name it exactly: `drive-storage`
3. Set **Public**: Off (private bucket)

### Step 6 — Create the First Admin User
1. In Supabase → **Authentication** → **Users** → **Add User**
2. Enter email and password
3. Go to **Table Editor** → `users` table → find the new user
4. Change `role` from `user` to `admin`

### Step 7 — Open the App
Simply open `index.html` in your browser (or serve with a local server):

**Using VS Code Live Server:**
- Install the Live Server extension
- Right-click `index.html` → Open with Live Server

**Using Python:**
```bash
cd "c:\Users\ELCOT\Desktop\file"
python -m http.server 8080
```
Then open: `http://localhost:8080`

---

## 📁 Project Structure
```
google-drive-clone/
├── index.html          ← Auto-redirect (login or dashboard)
├── login.html          ← Authentication page
├── dashboard.html      ← My Drive (main file browser)
├── folder.html         ← Folder contents view
├── shared.html         ← Files shared with you
├── recent.html         ← Recently accessed files
├── trash.html          ← Deleted files / Trash bin
├── profile.html        ← User profile settings
├── settings.html       ← App preferences
├── admin.html          ← Admin dashboard
├── 404.html            ← Custom 404 page
│
├── css/
│   ├── style.css       ← Global design system (tokens, components)
│   ├── login.css       ← Login page styles
│   ├── dashboard.css   ← Dashboard layout styles
│   ├── sidebar.css     ← Sidebar navigation
│   ├── card.css        ← File & folder cards
│   └── responsive.css  ← Mobile/tablet breakpoints
│
├── js/
│   ├── supabase.js     ← ⚠️  PUT YOUR CREDENTIALS HERE
│   ├── auth.js         ← Login, logout, session guard
│   ├── app.js          ← Bootstrap, theme, topbar, sidebar
│   ├── dashboard.js    ← My Drive page controller
│   ├── upload.js       ← Drag-drop upload, progress panel
│   ├── files.js        ← File CRUD, preview, download, cards
│   ├── folders.js      ← Folder CRUD, breadcrumb
│   ├── search.js       ← Search & filter
│   ├── share.js        ← File sharing with permissions
│   ├── trash.js        ← Trash restore & empty
│   ├── profile.js      ← Profile photo, name, password
│   ├── admin.js        ← Admin stats, user management, logs
│   ├── settings.js     ← Theme, notifications, shortcuts
│   ├── notification.js ← Toast notification system
│   └── utils.js        ← Shared helper functions
│
├── components/
│   └── sidebar.html    ← Reusable sidebar component
│
├── assets/
│   └── logo.svg        ← App logo
│
└── database/
    ├── schema.sql      ← PostgreSQL table definitions
    └── policies.sql    ← Row Level Security policies
```

---

## 🎨 Features

| Feature | Details |
|---|---|
| **Authentication** | Email/password login, forgot password, session guard |
| **File Upload** | Drag-drop, multi-file, progress bar, any format |
| **Folders** | Create, rename, delete, nested, breadcrumb |
| **File Actions** | View, download, rename, star, share, delete, restore |
| **Preview** | Image lightbox, PDF viewer, video/audio player |
| **Search** | By name, type, date, size with filters |
| **Sort** | Newest/Oldest/A-Z/Z-A/Largest/Smallest |
| **Sharing** | Share by email with View/Edit permissions, public links |
| **Trash** | Soft delete, restore, permanent delete, empty |
| **Starred** | Star/unstar files, dedicated starred view |
| **Dark Mode** | Full dark/light theme toggle, persisted |
| **Admin** | Stats dashboard, user management, activity logs |
| **Responsive** | Mobile, tablet, desktop layouts |

---

## 🔐 Security

- All data protected by **Supabase Row Level Security (RLS)**
- Users can only see/edit their own files
- Admins have full access to all users and files
- Storage bucket access controlled via RLS policies
- No public registration — admin creates all users

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript ES6 (modules)
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Icons:** Google Material Symbols (CDN)
- **Fonts:** Inter via Google Fonts (CDN)
- **Supabase SDK:** via CDN (no bundler needed)

---

## 💡 Tips

- Press `/` or `Ctrl+K` to focus the search bar
- Press `Ctrl+U` to open the upload file picker
- Press `Esc` to close any modal or dropdown
- Right-click any file/folder for a context menu
- Double-click a folder to open it
