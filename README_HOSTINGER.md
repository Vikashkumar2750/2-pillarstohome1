# Pillars to Home - Hostinger Deployment Guide

This application is built with a dual-stack approach:
1. **AI Studio Preview (Node.js/SQLite):** For real-time preview in the AI Studio environment.
2. **Production Deployment (PHP/MySQL):** For your actual Hostinger shared hosting.

## 📋 Prerequisites
- A Hostinger Shared Hosting account (cPanel or hPanel).
- A MySQL database created in your Hostinger dashboard.

## 🚀 Deployment Steps

### 1. Database Setup
1. Log in to your Hostinger dashboard.
2. Go to **Databases** > **MySQL Databases**.
3. Create a new database (e.g., `pillarstohome`) and a database user.
4. Open **phpMyAdmin** for that database.
5. Click the **Import** tab.
6. Select the `database.sql` file from this project.
7. Click **Go** to import the schema and seed data.

### 2. Configure Database Connection
1. Open `includes/db.php` in your Hostinger File Manager.
2. Update the following variables with your actual Hostinger database credentials:
   ```php
   $host = 'localhost'; // Usually 'localhost' on Hostinger
   $db   = 'YOUR_DATABASE_NAME';
   $user = 'YOUR_DATABASE_USER';
   $pass = 'YOUR_DATABASE_PASSWORD';
   ```

### 3. Upload Files
1. Upload all `.php` files, the `includes/` folder, `api/` folder, `P2Sadmin/` folder, `assets/` folder, and the `.htaccess` file to your `public_html` directory.
2. **Note:** You do NOT need to upload `server.ts`, `package.json`, `tsconfig.json`, `vite.config.ts`, or the `src/` folder to Hostinger. These are only for the AI Studio preview.

### 4. Admin Access
- Access your CRM dashboard at: `https://yourdomain.com/P2Sadmin`
- **Default Admin Login:**
  - Username: `admin`
  - Password: `admin123`
- **Default Agent Login:**
  - Username: `agent`
  - Password: `agent123`

## 🔒 Security Notes
- Change the default passwords immediately after logging in.
- The `.htaccess` file is already optimized for security and performance on Apache.
- Ensure your `public_html` permissions are set correctly (usually 755 for directories and 644 for files).
