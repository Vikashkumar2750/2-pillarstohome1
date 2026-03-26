# Hostinger Deployment Guide

This guide covers deploying your full-stack React + Node.js (SQLite) application on Hostinger.

## Prerequisites
Before deploying, ensure you have built the application for production:
```bash
npm run build
```
This command generates two folders:
- `dist/` (Your compiled React frontend)
- `dist-server/` (Your compiled Node.js backend)

---

## Option 1: Hostinger Shared Web Hosting (hPanel / cPanel)

If you are using Hostinger's standard Web Hosting (Premium/Business) that supports Node.js via Phusion Passenger:

1. **Zip your project files**:
   Select the following files and folders and compress them into a `.zip` file:
   - `dist/`
   - `dist-server/`
   - `node_modules/` (or run `npm install --production` on the server via SSH)
   - `.env` (Make sure to set your production environment variables)
   - `.htaccess`
   - `package.json`
   - `database.sqlite` (If you want to keep existing data, otherwise it will be created automatically)

2. **Upload to Hostinger**:
   - Go to your Hostinger hPanel -> **File Manager**.
   - Navigate to your domain's `public_html` folder.
   - Upload and extract the `.zip` file.

3. **Configure Node.js App in hPanel (If available)**:
   - In hPanel, search for **Node.js** under the Advanced section.
   - Create a new Node.js application.
   - Set the **Application startup file** to: `dist-server/server.js`
   - Save and Start the application.

4. **Update `.htaccess` (Important)**:
   The included `.htaccess` file has placeholder paths for Phusion Passenger. You **must** update them to match your Hostinger account:
   - Open `.htaccess` in the File Manager.
   - Replace `u123456789` with your actual Hostinger username.
   - Replace `yourdomain.com` with your actual domain name.
   - Ensure `PassengerStartupFile` points to `dist-server/server.js`.

---

## Option 2: Hostinger VPS (Recommended)

If you are using a Hostinger VPS (Virtual Private Server) with Ubuntu/Debian, the deployment is much more robust using PM2.

1. **Connect to your VPS via SSH**:
   ```bash
   ssh root@your_vps_ip
   ```

2. **Install Node.js and PM2**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

3. **Upload your files**:
   Use SFTP (FileZilla) or `scp` to upload your project to `/var/www/pillarstohome`.
   *Note: You only need `dist/`, `dist-server/`, `package.json`, and `.env`.*

4. **Install Production Dependencies**:
   ```bash
   cd /var/www/pillarstohome
   npm install --production
   ```

5. **Start the App with PM2**:
   We have included an `ecosystem.config.cjs` file for PM2.
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```

6. **Set up Nginx Reverse Proxy (Optional but Recommended)**:
   To serve your app on port 80/443 (HTTP/HTTPS) instead of 3000:
   ```bash
   sudo apt install nginx
   ```
   Create a new config file `/etc/nginx/sites-available/pillarstohome`:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/pillarstohome /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

## Troubleshooting

- **Database Errors**: Ensure the `database.sqlite` file has write permissions (`chmod 666 database.sqlite`) and the folder containing it has write permissions (`chmod 777 .`).
- **503 Service Unavailable**: This usually means the Node.js server crashed. Check the logs.
  - On VPS: `pm2 logs`
  - On Shared Hosting: Check the `stderr.log` or Node.js app logs in hPanel.
- **Port in Use**: If port 3000 is in use on your VPS, change the `PORT` in `.env` or `ecosystem.config.cjs` to something else (e.g., 3001).
