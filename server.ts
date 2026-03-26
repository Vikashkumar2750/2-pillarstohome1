import express from "express";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import mysql from "mysql2/promise";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "pillarstohome-super-secret-key-2026";

// Database Connection
let db: any;
let mysqlPool: any;
let isMySQL = false;

if (process.env.DB_HOST) {
  isMySQL = true;
  console.log(`Attempting to use MySQL Database at ${process.env.DB_HOST}:${process.env.DB_PORT || "3306"}`);
  mysqlPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || "3306"),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000 // 10 seconds timeout
  });
} else {
  console.log("Using SQLite Database (No DB_HOST provided)");
  db = new sqlite3.Database("./database.sqlite");
}

const pool = {
  query: async (sql: string, params: any[] = []): Promise<any> => {
    if (isMySQL) {
      try {
        const [rows] = await mysqlPool.execute(sql, params);
        return [rows];
      } catch (error) {
        console.error("MySQL Query Error:", error);
        throw error;
      }
    } else {
      // Convert MySQL syntax to SQLite
      let sqliteSql = sql
        .replace(/INT AUTO_INCREMENT PRIMARY KEY/g, "INTEGER PRIMARY KEY AUTOINCREMENT")
        .replace(/TINYINT\(1\)/g, "INTEGER")
        .replace(/JSON/g, "TEXT")
        .replace(/ENGINE=InnoDB/g, "")
        .replace(/ON UPDATE CURRENT_TIMESTAMP/g, "")
        .replace(/UNIQUE KEY \w+ \((.*?)\)/g, "UNIQUE($1)")
        .replace(/ON DUPLICATE KEY UPDATE value = VALUES\(value\)/g, "ON CONFLICT(`key`) DO UPDATE SET value = excluded.value");

      return new Promise((resolve, reject) => {
        const cmd = sqliteSql.trim().toUpperCase();
        const isSelect = cmd.startsWith("SELECT") || cmd.startsWith("PRAGMA") || cmd.startsWith("WITH") || cmd.startsWith("SHOW") || cmd.startsWith("EXPLAIN");
        
        if (isSelect) {
          db.all(sqliteSql, params, (err: any, rows: any) => {
            if (err) {
              console.error("SQL Error:", err, "Query:", sqliteSql);
              reject(err);
            }
            else resolve([rows]);
          });
        } else {
          db.run(sqliteSql, params, function(err: any) {
            if (err) {
              console.error("SQL Error:", err, "Query:", sqliteSql);
              reject(err);
            }
            else resolve([{ insertId: (this as any).lastID, affectedRows: (this as any).changes, lastID: (this as any).lastID }]);
          });
        }
      });
    }
  },
  getConnection: async () => {
    if (isMySQL) {
      return await mysqlPool.getConnection();
    }
    return { release: () => {} };
  }
};

// Initialize Database
async function initDatabase() {
  try {
    // Check connection first
    if (isMySQL) {
      try {
        const connection = await pool.getConnection();
        console.log("MySQL connected successfully");
        connection.release();
      } catch (err) {
        console.error("MySQL connection failed. Falling back to SQLite for this session:", err);
        isMySQL = false;
        db = new sqlite3.Database("./database.sqlite");
      }
    } else {
      console.log("SQLite connected successfully");
    }

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        price VARCHAR(100),
        location VARCHAR(255),
        type VARCHAR(100),
        beds INT,
        baths INT,
        sqft INT,
        image TEXT,
        featured TINYINT(1),
        description TEXT,
        amenities JSON,
        story_title VARCHAR(255),
        story_text TEXT,
        video_url VARCHAR(255)
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255),
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'New',
        type VARCHAR(50) DEFAULT 'Inquiry',
        property_title VARCHAR(255),
        tour_date DATE,
        tour_time VARCHAR(50),
        source VARCHAR(100),
        is_abandoned TINYINT(1) DEFAULT 1,
        notes TEXT,
        budget VARCHAR(100),
        intent VARCHAR(100),
        score INT DEFAULT 0,
        assigned_to INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255),
        lead_id INT,
        event_type VARCHAR(100),
        page VARCHAR(255),
        data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE,
        password_hash VARCHAR(255),
        role VARCHAR(50)
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message TEXT,
        type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        \`key\` VARCHAR(100) PRIMARY KEY,
        value TEXT
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page VARCHAR(100),
        section VARCHAR(100),
        \`key\` VARCHAR(100),
        value TEXT,
        type VARCHAR(50) DEFAULT 'text',
        description TEXT,
        UNIQUE KEY page_section_key (page, section, \`key\`)
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(255) UNIQUE,
        title VARCHAR(255),
        show_header TINYINT(1) DEFAULT 1,
        show_footer TINYINT(1) DEFAULT 1,
        parent_id INT,
        \`order\` INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        label VARCHAR(100),
        url VARCHAR(255),
        parent_id INT,
        order_index INT DEFAULT 0
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS page_sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_slug VARCHAR(255),
        section_type VARCHAR(50),
        title VARCHAR(255),
        subtitle VARCHAR(255),
        content TEXT,
        order_index INT DEFAULT 0,
        FOREIGN KEY (page_slug) REFERENCES pages(slug) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Seed settings if empty
    const [settingsRows]: any = await pool.query("SELECT COUNT(*) as count FROM settings");
    if (settingsRows[0].count === 0) {
      const defaultWeights = {
        page_view: 10,
        investment_page_bonus: 20,
        listings_page_bonus: 15,
        property_page_bonus: 10,
        scroll_depth_multiplier: 5,
        variety_bonus: 5,
        name_bonus: 15,
        email_bonus: 25,
        phone_bonus: 25,
        submission_bonus: 60,
        intent_investment_bonus: 40,
        intent_selfuse_bonus: 25,
        budget_high_bonus: 120,
        budget_mid_bonus: 70,
        budget_low_bonus: 30,
        report_unlock_bonus: 50,
        brochure_download_bonus: 30,
        gallery_engagement_bonus: 5,
        cinematic_tour_bonus: 20
      };
      await pool.query("INSERT INTO settings (key, value) VALUES (?, ?)", ["lead_scoring_weights", JSON.stringify(defaultWeights)]);
    }

    // Seed pages if empty
    const [pagesRows]: any = await pool.query("SELECT COUNT(*) as count FROM pages");
    if (pagesRows[0].count === 0) {
      const initialPages = [
        ['home', 'Home', 1, 1, null, 0],
        ['listings', 'Properties', 1, 1, null, 1],
        ['investment', 'Investment', 1, 1, null, 2],
        ['about', 'About', 1, 1, null, 3],
        ['contact', 'Contact', 1, 1, null, 4],
        ['privacy', 'Privacy Policy', 1, 1, null, 5],
        ['terms', 'Terms of Service', 1, 1, null, 6],
        ['sitemap', 'Sitemap', 1, 1, null, 7]
      ];
      for (const p of initialPages) {
        await pool.query("INSERT INTO pages (slug, title, show_header, show_footer, parent_id, \`order\`) VALUES (?, ?, ?, ?, ?, ?)", p);
        
        if (p[0] === 'privacy') {
          const privacyContent = '<div class="prose prose-invert max-w-none"><p>Last updated: March 24, 2026</p><h3>1. Introduction</h3><p>Welcome to PillarstoHome Real Estate. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p><h3>2. The Data We Collect About You</h3><p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p><ul><li><strong>Identity Data</strong> includes first name, last name, username or similar identifier, title, and date of birth.</li><li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li><li><strong>Financial Data</strong> includes bank account and payment card details.</li><li><strong>Transaction Data</strong> includes details about payments to and from you and other details of properties or services you have purchased from us.</li><li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li></ul><h3>3. How We Use Your Personal Data</h3><p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p><ul><li>Where we need to perform the contract we are about to enter into or have entered into with you.</li><li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li><li>Where we need to comply with a legal obligation.</li></ul><h3>4. Data Security</h3><p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.</p><h3>5. Your Legal Rights</h3><p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where the lawful ground of processing is consent) to withdraw consent.</p></div>';
          await pool.query("INSERT INTO page_sections (page_slug, section_type, title, content, order_index) VALUES (?, 'content', 'Privacy Policy', ?, 0)", [p[0], privacyContent]);
        } else if (p[0] === 'terms') {
          const termsContent = '<div class="prose prose-invert max-w-none"><p>Last updated: March 24, 2026</p><h3>1. Agreement to Terms</h3><p>By accessing or using our services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p><h3>2. Use License</h3><p>Permission is granted to temporarily download one copy of the materials (information or software) on PillarstoHome Real Estate\'s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p><ul><li>modify or copy the materials;</li><li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li><li>attempt to decompile or reverse engineer any software contained on PillarstoHome Real Estate\'s website;</li><li>remove any copyright or other proprietary notations from the materials; or</li><li>transfer the materials to another person or "mirror" the materials on any other server.</li></ul><h3>3. Disclaimer</h3><p>The materials on PillarstoHome Real Estate\'s website are provided on an \'as is\' basis. PillarstoHome Real Estate makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p><h3>4. Limitations</h3><p>In no event shall PillarstoHome Real Estate or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on PillarstoHome Real Estate\'s website, even if PillarstoHome Real Estate or a PillarstoHome Real Estate authorized representative has been notified orally or in writing of the possibility of such damage.</p><h3>5. Revisions and Errata</h3><p>The materials appearing on PillarstoHome Real Estate\'s website could include technical, typographical, or photographic errors. PillarstoHome Real Estate does not warrant that any of the materials on its website are accurate, complete or current. PillarstoHome Real Estate may make changes to the materials contained on its website at any time without notice.</p></div>';
          await pool.query("INSERT INTO page_sections (page_slug, section_type, title, content, order_index) VALUES (?, 'content', 'Terms of Service', ?, 0)", [p[0], termsContent]);
        } else if (p[0] === 'sitemap') {
          const sitemapContent = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8\"><div><h3 class="text-gold-500 font-serif text-xl mb-4">Main Navigation</h3><ul class="space-y-2"><li><a href="/" class="text-gray-300 hover:text-gold-500 transition-colors">Home</a></li><li><a href="/listings" class="text-gray-300 hover:text-gold-500 transition-colors">Exclusive Properties</a></li><li><a href="/investment" class="text-gray-300 hover:text-gold-500 transition-colors">Investment Opportunities</a></li><li><a href="/about" class="text-gray-300 hover:text-gold-500 transition-colors">About Us</a></li><li><a href="/contact" class="text-gray-300 hover:text-gold-500 transition-colors">Contact Us</a></li></ul></div><div><h3 class="text-gold-500 font-serif text-xl mb-4">Legal</h3><ul class="space-y-2"><li><a href="/privacy" class="text-gray-300 hover:text-gold-500 transition-colors">Privacy Policy</a></li><li><a href="/terms" class="text-gray-300 hover:text-gold-500 transition-colors">Terms of Service</a></li><li><a href="/sitemap" class="text-gray-300 hover:text-gold-500 transition-colors">Sitemap</a></li></ul></div><div><h3 class="text-gold-500 font-serif text-xl mb-4">Account</h3><ul class="space-y-2"><li><a href="/admin" class="text-gray-300 hover:text-gold-500 transition-colors">Admin Dashboard</a></li></ul></div></div>';
          await pool.query("INSERT INTO page_sections (page_slug, section_type, title, content, order_index) VALUES (?, 'content', 'Sitemap', ?, 0)", [p[0], sitemapContent]);
        }
      }
    } else {
      // Ensure privacy, terms, and sitemap exist
      const missingPages = [
        ['privacy', 'Privacy Policy', 1, 1, null, 5],
        ['terms', 'Terms of Service', 1, 1, null, 6],
        ['sitemap', 'Sitemap', 1, 1, null, 7]
      ];
      for (const p of missingPages) {
        const [existing]: any = await pool.query("SELECT id FROM pages WHERE slug = ?", [p[0]]);
        if (existing.length === 0) {
          await pool.query("INSERT INTO pages (slug, title, show_header, show_footer, parent_id, `order`) VALUES (?, ?, ?, ?, ?, ?)", p);
          if (p[0] === 'privacy') {
            const privacyContent = '<div class="prose prose-invert max-w-none"><p>Last updated: March 24, 2026</p><h3>1. Introduction</h3><p>Welcome to PillarstoHome Real Estate. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p><h3>2. The Data We Collect About You</h3><p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p><ul><li><strong>Identity Data</strong> includes first name, last name, username or similar identifier, title, and date of birth.</li><li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li><li><strong>Financial Data</strong> includes bank account and payment card details.</li><li><strong>Transaction Data</strong> includes details about payments to and from you and other details of properties or services you have purchased from us.</li><li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li></ul><h3>3. How We Use Your Personal Data</h3><p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p><ul><li>Where we need to perform the contract we are about to enter into or have entered into with you.</li><li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li><li>Where we need to comply with a legal obligation.</li></ul><h3>4. Data Security</h3><p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.</p><h3>5. Your Legal Rights</h3><p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where the lawful ground of processing is consent) to withdraw consent.</p></div>';
            await pool.query("INSERT INTO page_sections (page_slug, section_type, title, content, order_index) VALUES (?, 'content', 'Privacy Policy', ?, 0)", [p[0], privacyContent]);
          } else if (p[0] === 'terms') {
            const termsContent = '<div class="prose prose-invert max-w-none"><p>Last updated: March 24, 2026</p><h3>1. Agreement to Terms</h3><p>By accessing or using our services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p><h3>2. Use License</h3><p>Permission is granted to temporarily download one copy of the materials (information or software) on PillarstoHome Real Estate\'s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p><ul><li>modify or copy the materials;</li><li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li><li>attempt to decompile or reverse engineer any software contained on PillarstoHome Real Estate\'s website;</li><li>remove any copyright or other proprietary notations from the materials; or</li><li>transfer the materials to another person or "mirror" the materials on any other server.</li></ul><h3>3. Disclaimer</h3><p>The materials on PillarstoHome Real Estate\'s website are provided on an \'as is\' basis. PillarstoHome Real Estate makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p><h3>4. Limitations</h3><p>In no event shall PillarstoHome Real Estate or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on PillarstoHome Real Estate\'s website, even if PillarstoHome Real Estate or a PillarstoHome Real Estate authorized representative has been notified orally or in writing of the possibility of such damage.</p><h3>5. Revisions and Errata</h3><p>The materials appearing on PillarstoHome Real Estate\'s website could include technical, typographical, or photographic errors. PillarstoHome Real Estate does not warrant that any of the materials on its website are accurate, complete or current. PillarstoHome Real Estate may make changes to the materials contained on its website at any time without notice.</p></div>';
            await pool.query("INSERT INTO page_sections (page_slug, section_type, title, content, order_index) VALUES (?, 'content', 'Terms of Service', ?, 0)", [p[0], termsContent]);
          } else if (p[0] === 'sitemap') {
            const sitemapContent = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8\"><div><h3 class="text-gold-500 font-serif text-xl mb-4">Main Navigation</h3><ul class="space-y-2"><li><a href="/" class="text-gray-300 hover:text-gold-500 transition-colors">Home</a></li><li><a href="/listings" class="text-gray-300 hover:text-gold-500 transition-colors">Exclusive Properties</a></li><li><a href="/investment" class="text-gray-300 hover:text-gold-500 transition-colors">Investment Opportunities</a></li><li><a href="/about" class="text-gray-300 hover:text-gold-500 transition-colors">About Us</a></li><li><a href="/contact" class="text-gray-300 hover:text-gold-500 transition-colors">Contact Us</a></li></ul></div><div><h3 class="text-gold-500 font-serif text-xl mb-4">Legal</h3><ul class="space-y-2"><li><a href="/privacy" class="text-gray-300 hover:text-gold-500 transition-colors">Privacy Policy</a></li><li><a href="/terms" class="text-gray-300 hover:text-gold-500 transition-colors">Terms of Service</a></li><li><a href="/sitemap" class="text-gray-300 hover:text-gold-500 transition-colors">Sitemap</a></li></ul></div><div><h3 class="text-gold-500 font-serif text-xl mb-4">Account</h3><ul class="space-y-2"><li><a href="/admin" class="text-gray-300 hover:text-gold-500 transition-colors">Admin Dashboard</a></li></ul></div></div>';
            await pool.query("INSERT INTO page_sections (page_slug, section_type, title, content, order_index) VALUES (?, 'content', 'Sitemap', ?, 0)", [p[0], sitemapContent]);
          }
        }
      }
    }

    // Seed menu_items if empty
    const [menuRows]: any = await pool.query("SELECT COUNT(*) as count FROM menu_items");
    if (menuRows[0].count === 0) {
      const initialMenu = [
        ['Home', '/', null, 0],
        ['Properties', '/listings', null, 1],
        ['Investment', '/investment', null, 2],
        ['About', '/about', null, 3],
        ['Contact', '/contact', null, 4]
      ];
      for (const m of initialMenu) {
        await pool.query("INSERT INTO menu_items (label, url, parent_id, order_index) VALUES (?, ?, ?, ?)", m);
      }
    }

    // Seed site_content if empty
    const [contentRows]: any = await pool.query("SELECT COUNT(*) as count FROM site_content");
    if (contentRows[0].count === 0) {
      const initialContent = [
        // Home Page - Hero
        ['home', 'hero', 'title', 'Discover Exceptional <br/> <span class="text-gold-500 italic">Living Spaces</span>', 'html', 'Main hero title'],
        ['home', 'hero', 'subtitle', 'Curating the world\'s most prestigious real estate for the discerning investor. From Dubai penthouses to London estates.', 'text', 'Hero subtitle'],
        ['home', 'hero', 'cta_text', 'Explore Collection', 'text', 'Hero CTA button text'],
        ['home', 'hero', 'cta_link', '/listings', 'text', 'Hero CTA button link'],
        ['home', 'hero', 'video_url', 'https://www.youtube.com/watch?v=0k_v9E_7v6c', 'text', 'Hero background video/modal URL'],
        ['home', 'hero', 'image', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80', 'image', 'Hero background image'],

        // Home Page - Stats
        ['home', 'stats', 'stat1_value', '$4.2B', 'text', 'Stat 1 value'],
        ['home', 'stats', 'stat1_label', 'Assets Managed', 'text', 'Stat 1 label'],
        ['home', 'stats', 'stat2_value', '120+', 'text', 'Stat 2 value'],
        ['home', 'stats', 'stat2_label', 'Global Partners', 'text', 'Stat 2 label'],
        ['home', 'stats', 'stat3_value', '15', 'text', 'Stat 3 value'],
        ['home', 'stats', 'stat3_label', 'Years Excellence', 'text', 'Stat 3 label'],

        // Investment Page
        ['investment', 'hero', 'title', 'Strategic Real Estate <br/> <span class="text-gold-500 italic">Wealth Management</span>', 'html', 'Investment hero title'],
        ['investment', 'hero', 'subtitle', 'Data-driven insights for high-yield property portfolios across global markets.', 'text', 'Investment hero subtitle'],
        
        // Global Config
        ['global', 'theme', 'header_style', 'transparent', 'text', 'Header style (transparent, solid_dark, solid_light)'],
        ['global', 'theme', 'footer_style', 'dark', 'text', 'Footer style (dark, light, minimal)'],
        ['global', 'footer', 'company_name', 'PillarstoHome Real Estate', 'text', 'Company name in footer'],
        ['global', 'footer', 'address', '3039p Sector 57, Hong Kong Bazaar', 'text', 'Office address'],
        ['global', 'contact', 'phone', '+919911414220', 'text', 'Contact phone number'],
        ['global', 'contact', 'email', 'Pillarstohome57@gmail.com', 'text', 'Contact email address'],
        ['global', 'footer', 'about_text', 'PillarstoHome is a premier luxury real estate CRM and investment platform, dedicated to providing unparalleled service and exclusive opportunities to our elite clientele.', 'textarea', 'About text in footer'],
        ['global', 'social', 'facebook', 'https://facebook.com', 'link', 'Facebook profile link'],
        ['global', 'social', 'instagram', 'https://instagram.com', 'link', 'Instagram profile link'],
        ['global', 'social', 'linkedin', 'https://linkedin.com', 'link', 'LinkedIn profile link'],
        ['global', 'social', 'twitter', 'https://twitter.com', 'link', 'Twitter profile link'],

        // Home Page - Featured
        ['home', 'featured', 'title', 'Featured Collection', 'text', 'Featured properties section title'],
        ['home', 'featured', 'subtitle', 'Exclusive properties handpicked for you.', 'text', 'Featured properties section subtitle'],
        
        // Home Page - Report
        ['home', 'report', 'title', '2026 Luxury Real Estate Outlook', 'text', 'Report section title'],
        ['home', 'report', 'subtitle', 'Get exclusive access to our comprehensive analysis of global luxury market trends, emerging hotspots, and investment forecasts.', 'textarea', 'Report section subtitle'],
        ['home', 'report', 'cta_text', 'Access Exclusive Insights', 'text', 'Report section CTA button text'],

        // Investment Page - Market
        ['investment', 'market', 'title', '2026 Market Intelligence', 'text', 'Market insights section title'],
        ['investment', 'market', 'subtitle', 'Comparative analysis of capital appreciation across prime global markets.', 'text', 'Market insights section subtitle'],
        ['investment', 'visualizer', 'visualizer_title', 'Visualize Your Future', 'text', 'AI Visualizer title'],
        ['investment', 'visualizer', 'visualizer_subtitle', 'Use our AI architectural visualizer to explore high-end design concepts for your next residence.', 'textarea', 'AI Visualizer subtitle'],
        ['investment', 'philosophy', 'philosophy_title', 'Our Investment Philosophy', 'text', 'Philosophy title'],
        ['investment', 'philosophy', 'philosophy_text', 'We don\'t just sell properties; we curate wealth-building opportunities. Our selection process involves rigorous due diligence on developer track records, location infrastructure growth, and historical secondary market performance.', 'textarea', 'Philosophy text'],
        ['investment', 'philosophy', 'stat1_value', '$2.4B+', 'text', 'Philosophy stat 1 value'],
        ['investment', 'philosophy', 'stat1_label', 'Assets Managed', 'text', 'Philosophy stat 1 label'],
        ['investment', 'philosophy', 'stat2_value', '14%', 'text', 'Philosophy stat 2 value'],
        ['investment', 'philosophy', 'stat2_label', 'Avg. Annual Return', 'text', 'Philosophy stat 2 label'],
        ['investment', 'philosophy', 'stat3_value', '12', 'text', 'Philosophy stat 3 value'],
        ['investment', 'philosophy', 'stat3_label', 'Global Markets', 'text', 'Philosophy stat 3 label'],

        // About Page
        ['about', 'hero', 'title', 'Redefining Luxury Real Estate', 'html', 'About hero title'],
        ['about', 'hero', 'subtitle', 'PillarstoHome Real Estate is a premier boutique brokerage specializing in the world\'s most exclusive properties. We provide unparalleled service, discretion, and expertise to ultra-high-net-worth individuals globally.', 'textarea', 'About hero subtitle'],
        ['about', 'features', 'feature1_title', 'Global Reach', 'text', 'Feature 1 title'],
        ['about', 'features', 'feature1_desc', 'Access to off-market properties in London, Dubai, New York, and Mumbai.', 'text', 'Feature 1 description'],
        ['about', 'features', 'feature2_title', 'Absolute Discretion', 'text', 'Feature 2 title'],
        ['about', 'features', 'feature2_desc', 'We protect our clients\' privacy with military-grade confidentiality agreements.', 'text', 'Feature 2 description'],
        ['about', 'features', 'feature3_title', 'Award-Winning', 'text', 'Feature 3 title'],
        ['about', 'features', 'feature3_desc', 'Recognized as the leading luxury brokerage in the Middle East and Asia.', 'text', 'Feature 3 description'],
        ['about', 'vision', 'vision_label', 'Our Vision', 'text', 'Vision section label'],
        ['about', 'vision', 'vision_text', 'To curate the world\'s finest living experiences for those who demand nothing but the best.', 'textarea', 'Vision section text'],
        ['about', 'vision', 'vision_image', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2000&q=80', 'image', 'Vision section background image'],

        // Contact Page
        ['contact', 'hero', 'title', 'Get in Touch', 'text', 'Contact hero title'],
        ['contact', 'hero', 'subtitle', 'Whether you are looking to buy, sell, or invest in luxury real estate, our team of experts is here to provide unparalleled service.', 'textarea', 'Contact hero subtitle'],

        // Home Page - Why Choose Us
        ['home', 'why', 'why_title', 'Why Choose PillarstoHome', 'text', 'Why Choose Us title'],
        ['home', 'why', 'why_subtitle', 'We redefine luxury real estate through technology, expertise, and personalized service.', 'textarea', 'Why Choose Us subtitle'],
        ['home', 'why', 'why_feature1_title', 'AI-Powered Insights', 'text', 'Why feature 1 title'],
        ['home', 'why', 'why_feature1_desc', 'Our advanced AI concierge helps qualify your needs and provides personalized property recommendations in real-time.', 'textarea', 'Why feature 1 description'],
        ['home', 'why', 'why_feature2_title', 'Exclusive Inventory', 'text', 'Why feature 2 title'],
        ['home', 'why', 'why_feature2_desc', 'Gain access to off-market listings and premium developments before they hit the general market.', 'textarea', 'Why feature 2 description'],
        ['home', 'why', 'why_feature3_title', 'Global Network', 'text', 'Why feature 3 title'],
        ['home', 'why', 'why_feature3_desc', 'With experts in London, Dubai, and Mumbai, we provide a truly international perspective on luxury investments.', 'textarea', 'Why feature 3 description'],

        // Home Page - Lead Capture
        ['home', 'lead', 'lead_capture_title', 'Let us find your dream home.', 'text', 'Lead capture title'],
        ['home', 'lead', 'lead_capture_subtitle', 'Our dedicated team of luxury real estate experts is ready to assist you in finding the perfect property that matches your lifestyle and investment goals.', 'textarea', 'Lead capture subtitle'],
        ['home', 'lead', 'lead_capture_bullet1', 'Off-market opportunities', 'text', 'Lead capture bullet 1'],
        ['home', 'lead', 'lead_capture_bullet2', 'Personalized property tours', 'text', 'Lead capture bullet 2'],
        ['home', 'lead', 'lead_capture_bullet3', 'Expert negotiation', 'text', 'Lead capture bullet 3'],

        // Listings Page
        ['listings', 'hero', 'title', 'Exclusive Properties', 'text', 'Listings hero title'],
        ['listings', 'hero', 'subtitle', 'Explore our curated collection of the world\'s finest real estate.', 'textarea', 'Listings hero subtitle'],
        ['listings', 'recommendations', 'recommendations_title', 'Recommended for you', 'text', 'Recommendations section title'],

        // Global - Navbar
        ['global', 'navbar', 'company_name', 'PillarstoHome', 'text', 'Company name in navbar'],
        ['global', 'navbar', 'cta_text', 'Inquire', 'text', 'Navbar CTA text'],

        // Global - Chatbot
        ['global', 'chatbot', 'welcome_message', 'Hello! I\'m your PillarstoHome AI concierge. Are you looking to buy or invest in luxury real estate? I can help you find the perfect property or investment opportunity.', 'textarea', 'Chatbot welcome message'],
        ['global', 'chatbot', 'placeholder', 'Ask about properties, investments, or locations...', 'text', 'Chatbot input placeholder'],

        // Global - Exit Intent
        ['global', 'exit_intent', 'title', 'Before You Go...', 'text', 'Exit intent popup title'],
        ['global', 'exit_intent', 'subtitle', 'Download our exclusive 2026 Luxury Real Estate Investment Guide for free.', 'textarea', 'Exit intent popup subtitle'],
        ['global', 'exit_intent', 'cta_text', 'Download Guide', 'text', 'Exit intent popup CTA text'],

        // Global - SEO/Alt Texts
        ['global', 'seo', 'default_alt', 'Luxury Real Estate Property', 'text', 'Default alt text for images'],
        ['global', 'seo', 'meta_description', 'PillarstoHome - Premier luxury real estate CRM and investment platform for global investors.', 'textarea', 'Default meta description'],

        // Global - Icons (Lucide names or SVG paths)
        ['global', 'icons', 'hero_arrow', 'ArrowRight', 'icon', 'Icon name for hero arrow'],
        ['global', 'icons', 'contact_location', 'MapPin', 'icon', 'Icon name for contact location'],
        ['global', 'icons', 'contact_phone', 'Phone', 'icon', 'Icon name for contact phone'],
        ['global', 'icons', 'contact_email', 'Mail', 'icon', 'Icon name for contact email'],
        
        // Home Page - Why Choose Us Icons
        ['home', 'why', 'why_feature1_icon', 'Zap', 'icon', 'Why feature 1 icon'],
        ['home', 'why', 'why_feature2_icon', 'Building', 'icon', 'Why feature 2 icon'],
        ['home', 'why', 'why_feature3_icon', 'Globe', 'icon', 'Why feature 3 icon'],

        // About Page - Features Icons
        ['about', 'features', 'feature1_icon', 'Globe', 'icon', 'About feature 1 icon'],
        ['about', 'features', 'feature2_icon', 'Shield', 'icon', 'About feature 2 icon'],
        ['about', 'features', 'feature3_icon', 'Award', 'icon', 'About feature 3 icon'],

        // Investment Page - Features Icons
        ['investment', 'features', 'feature1_icon', 'TrendingUp', 'icon', 'Investment feature 1 icon'],
        ['investment', 'features', 'feature2_icon', 'Landmark', 'icon', 'Investment feature 2 icon'],
        ['investment', 'features', 'feature3_icon', 'PieChart', 'icon', 'Investment feature 3 icon'],

        // Global - Exit Intent Image
        ['global', 'exit_intent', 'exit_intent_image', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'image', 'Exit intent popup image'],
      ];
      for (const c of initialContent) {
        await pool.query("INSERT INTO site_content (page, section, \`key\`, value, type, description) VALUES (?, ?, ?, ?, ?, ?)", c);
      }
    } else {
      // Ensure theme settings exist
      const missingContent = [
        ['global', 'theme', 'header_style', 'transparent', 'text', 'Header style (transparent, solid_dark, solid_light)'],
        ['global', 'theme', 'footer_style', 'dark', 'text', 'Footer style (dark, light, minimal)']
      ];
      for (const c of missingContent) {
        const [existing]: any = await pool.query("SELECT id FROM site_content WHERE page = ? AND section = ? AND `key` = ?", [c[0], c[1], c[2]]);
        if (existing.length === 0) {
          await pool.query("INSERT INTO site_content (page, section, `key`, value, type, description) VALUES (?, ?, ?, ?, ?, ?)", c);
        }
      }
    }

    // Fix existing site content images if they were seeded with broken ones
    const imagesToUpdate = [
      ['home', 'hero', 'image', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80'],
      ['about', 'vision', 'vision_image', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2000&q=80'],
      ['global', 'exit_intent', 'exit_intent_image', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
    ];
    for (const img of imagesToUpdate) {
      await pool.query("UPDATE site_content SET value = ? WHERE page = ? AND section = ? AND `key` = ?", [img[3], img[0], img[1], img[2]]);
    }

    // Update existing contact info to new values
    const contactUpdates = [
      ['global', 'footer', 'address', '3039p Sector 57, Hong Kong Bazaar'],
      ['global', 'contact', 'phone', '+919911414220'],
      ['global', 'contact', 'email', 'Pillarstohome57@gmail.com'],
      ['global', 'navbar', 'company_name', 'PillarstoHome']
    ];
    for (const update of contactUpdates) {
      await pool.query("UPDATE site_content SET value = ? WHERE page = ? AND section = ? AND `key` = ?", [update[3], update[0], update[1], update[2]]);
    }
    
    // Ensure navbar company_name and logo_image exist
    const [companyNameRow]: any = await pool.query("SELECT id FROM site_content WHERE page = 'global' AND section = 'navbar' AND `key` = 'company_name'");
    if (companyNameRow.length === 0) {
      await pool.query("INSERT INTO site_content (page, section, `key`, value, type, description) VALUES ('global', 'navbar', 'company_name', 'PillarstoHome', 'text', 'Company name in header logo')");
    }
    const [logoImageRow]: any = await pool.query("SELECT id FROM site_content WHERE page = 'global' AND section = 'navbar' AND `key` = 'logo_image'");
    if (logoImageRow.length === 0) {
      await pool.query("INSERT INTO site_content (page, section, `key`, value, type, description) VALUES ('global', 'navbar', 'logo_image', '', 'image', 'Company logo image URL (overrides text if provided)')");
    }

    // Ensure global currency symbol exists
    const [currencyRow]: any = await pool.query("SELECT id FROM site_content WHERE page = 'global' AND section = 'settings' AND `key` = 'currency_symbol'");
    if (currencyRow.length === 0) {
      await pool.query("INSERT INTO site_content (page, section, `key`, value, type, description) VALUES ('global', 'settings', 'currency_symbol', '₹', 'text', 'Global currency symbol used across the website')");
    }

    // Seed properties if empty
    const [propRows]: any = await pool.query("SELECT COUNT(*) as count FROM properties");
    const props = [
      ["The Opus by Omniyat", "$4,500,000", "Business Bay, Dubai", "Penthouse", 4, 5, 5200, "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80", 1],
      ["One Hyde Park", "£18,000,000", "Knightsbridge, London", "Apartment", 3, 4, 3800, "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80", 1],
      ["Lodha Altamount", "₹40,000,000", "Altamount Road, Mumbai", "Villa", 5, 6, 6000, "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80", 1],
      ["Burj Khalifa Residence", "$2,200,000", "Downtown Dubai", "Apartment", 2, 3, 2100, "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80", 0],
      ["Palm Jumeirah Villa", "$12,000,000", "Palm Jumeirah, Dubai", "Villa", 6, 7, 8500, "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1200&q=80", 1],
      ["Chelsea Waterfront", "£3,500,000", "Chelsea, London", "Apartment", 2, 2, 1800, "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80", 0],
      ["Worli Sea Face Estate", "₹25,000,000", "Worli, Mumbai", "Penthouse", 4, 4, 4500, "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80", 1],
      ["Mayfair Mansion", "£25,000,000", "Mayfair, London", "Villa", 7, 8, 12000, "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80", 1]
    ];

    if (propRows[0].count === 0) {
      for (const p of props) {
        await pool.query("INSERT INTO properties (title, price, location, type, beds, baths, sqft, image, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", p);
      }
    } else {
      // Update existing property images to fix broken ones
      for (const p of props) {
        await pool.query("UPDATE properties SET image = ? WHERE title = ?", [p[7], p[0]]);
      }
      
      // Aggressive fix for any other properties that might have broken images
      const fallbackImage = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";
      await pool.query(`
        UPDATE properties 
        SET image = ? 
        WHERE image IS NULL 
           OR image = '' 
           OR image LIKE '%placeholder%' 
           OR image LIKE '%via.placeholder%'
      `, [fallbackImage]);
    }

    // Seed admins if empty
    const [adminRows]: any = await pool.query("SELECT COUNT(*) as count FROM admins");
    if (adminRows[0].count === 0) {
      const adminHash = bcrypt.hashSync("admin123", 10);
      const agentHash = bcrypt.hashSync("agent123", 10);
      await pool.query("INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)", ["admin", adminHash, "Super Admin"]);
      await pool.query("INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)", ["agent", agentHash, "Sales Agent"]);
    }
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}

async function startServer() {
  try {
    await initDatabase();
  } catch (err) {
    console.error("Database initialization failed. App will continue to start but database features may not work:", err);
  }
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Cross-Origin Resource Sharing logic implicitly enabling the separated Hostinger/Railway stack
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  app.use(express.json());

  // --- API ROUTES ---

  // Middleware to authenticate token
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401);
    
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Properties
  app.get("/api/properties", async (req, res) => {
    try {
      const [properties] = await pool.query("SELECT * FROM properties");
      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Single Property
  app.get("/api/properties/:id", async (req, res) => {
    try {
      const [rows]: any = await pool.query("SELECT * FROM properties WHERE id = ?", [req.params.id]);
      if (rows.length > 0) {
        const property = rows[0];
        if (property.amenities) {
          try {
            property.amenities = typeof property.amenities === 'string' ? JSON.parse(property.amenities) : property.amenities;
          } catch (e) {
            property.amenities = [];
          }
        }
        res.json(property);
      }
      else res.status(404).json({ error: "Not found" });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Lead Scoring Logic
  const calculateLeadScore = async (sessionId: string) => {
    try {
      const [events]: any = await pool.query("SELECT event_type, page, data FROM events WHERE session_id = ?", [sessionId]);
      const [leads]: any = await pool.query("SELECT * FROM leads WHERE session_id = ?", [sessionId]);
      const lead = leads[0];
      
      if (!lead) return 0;

      const [settingsRows]: any = await pool.query("SELECT value FROM settings WHERE key = 'lead_scoring_weights'");
      const weights = settingsRows.length > 0 ? JSON.parse(settingsRows[0].value) : {
        page_view: 10,
        investment_page_bonus: 20,
        listings_page_bonus: 15,
        property_page_bonus: 10,
        scroll_depth_multiplier: 5,
        variety_bonus: 5,
        name_bonus: 15,
        email_bonus: 25,
        phone_bonus: 25,
        submission_bonus: 60,
        intent_investment_bonus: 40,
        intent_selfuse_bonus: 25,
        budget_high_bonus: 120,
        budget_mid_bonus: 70,
        budget_low_bonus: 30,
        report_unlock_bonus: 50,
        brochure_download_bonus: 30,
        gallery_engagement_bonus: 5,
        cinematic_tour_bonus: 20
      };

      let score = 0;
      const visitedPages = new Set();
      let galleryClicks = 0;
      
      // Points for engagement
      events.forEach((e: any) => {
        if (e.event_type === 'page_view') {
          score += weights.page_view;
          visitedPages.add(e.page);
          // Bonus for high-value pages
          if (e.page === '/investment') score += weights.investment_page_bonus;
          if (e.page === '/listings') score += weights.listings_page_bonus;
          if (e.page.startsWith('/property/')) score += weights.property_page_bonus;
        }
        if (e.event_type === 'scroll_depth') {
          const depthData = JSON.parse(e.data || '{}');
          const depth = depthData.depth || 0;
          score += (depth / 25) * weights.scroll_depth_multiplier;
        }
        if (e.event_type === 'report_unlock') {
          score += weights.report_unlock_bonus;
        }
        if (e.event_type === 'brochure_download') {
          score += weights.brochure_download_bonus;
        }
        if (e.event_type === 'gallery_engagement') {
          if (galleryClicks < 5) { // Cap at 5 clicks for scoring
            score += weights.gallery_engagement_bonus;
            galleryClicks++;
          }
        }
        if (e.event_type === 'cinematic_tour_play') {
          score += weights.cinematic_tour_bonus;
        }
      });

      // Points for variety of pages visited
      score += visitedPages.size * weights.variety_bonus;

      // Points for data quality
      if (lead.name) score += weights.name_bonus;
      if (lead.email) score += weights.email_bonus;
      if (lead.phone) score += weights.phone_bonus;
      if (!lead.is_abandoned) score += weights.submission_bonus;

      // Points for high-value intent
      if (lead.intent === 'Investment') score += weights.intent_investment_bonus;
      if (lead.intent === 'Self-use') score += weights.intent_selfuse_bonus;
      
      // Points for budget
      if (lead.budget === '$10M+') score += weights.budget_high_bonus;
      if (lead.budget === '$3M - $10M') score += weights.budget_mid_bonus;
      if (lead.budget === '$1M - $3M') score += weights.budget_low_bonus;

      await pool.query("UPDATE leads SET score = ? WHERE session_id = ?", [score, sessionId]);
      return score;
    } catch (error) {
      console.error("Score calculation failed:", error);
      return 0;
    }
  };

  // Tracking Events
  app.post("/api/track", async (req, res) => {
    try {
      const { sessionId, eventType, page, data } = req.body;
      await pool.query("INSERT INTO events (session_id, event_type, page, data) VALUES (?, ?, ?, ?)", [sessionId, eventType, page, JSON.stringify(data || {})]);
      
      // Recalculate score asynchronously
      setTimeout(() => calculateLeadScore(sessionId), 0);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Partial Lead Capture (Abandoned Forms)
  app.post("/api/leads/partial", async (req, res) => {
    try {
      const { sessionId, name, email, phone, source, budget, intent, type, property } = req.body;
      
      // Check if lead exists for this session
      const [rows]: any = await pool.query("SELECT id FROM leads WHERE session_id = ?", [sessionId]);
      
      if (rows.length > 0) {
        await pool.query("UPDATE leads SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), budget = COALESCE(?, budget), intent = COALESCE(?, intent), type = COALESCE(?, type), property_title = COALESCE(?, property_title), updated_at = CURRENT_TIMESTAMP WHERE id = ?", [name, email, phone, budget, intent, type, property, rows[0].id]);
      } else {
        await pool.query("INSERT INTO leads (session_id, name, email, phone, source, is_abandoned, budget, intent, type, property_title) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)", [sessionId, name, email, phone, source || "Website", budget, intent, type || 'Inquiry', property]);
      }
      
      await calculateLeadScore(sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Full Lead Submission
  app.post("/api/leads", async (req, res) => {
    try {
      const { sessionId, name, email, phone, source, budget, intent, type, property, date, time } = req.body;
      
      const [rows]: any = await pool.query("SELECT id FROM leads WHERE session_id = ?", [sessionId]);
      
      if (rows.length > 0) {
        await pool.query("UPDATE leads SET name = ?, email = ?, phone = ?, budget = ?, intent = ?, is_abandoned = 0, status = 'New', type = ?, property_title = ?, tour_date = ?, tour_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [name, email, phone, budget, intent, type || 'Inquiry', property, date, time, rows[0].id]);
      } else {
        await pool.query("INSERT INTO leads (session_id, name, email, phone, source, is_abandoned, status, budget, intent, type, property_title, tour_date, tour_time) VALUES (?, ?, ?, ?, ?, 0, 'New', ?, ?, ?, ?, ?, ?)", [sessionId, name, email, phone, source || "Website", budget, intent, type || 'Inquiry', property, date, time]);
      }
      
      await calculateLeadScore(sessionId);
      
      // Trigger notification
      const notificationMsg = type === 'Tour Request' 
        ? `New Tour Request for ${property} from ${name || 'Unknown'}`
        : `New high-intent lead captured: ${name || 'Unknown'} (${source || 'Website'})`;
      
      await pool.query("INSERT INTO notifications (message, type) VALUES (?, ?)", [notificationMsg, 'info']);

      // Simulate Email Notification
      console.log(`[EMAIL NOTIFICATION] New Lead Submitted: ${name} (${email} / ${phone}) from ${source || 'Website'}`);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // CRM: Get Leads
  app.get("/api/crm/leads", authenticateToken, async (req, res) => {
    try {
      const [leads] = await pool.query("SELECT * FROM leads ORDER BY created_at DESC");
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // CRM: Delete Lead
  app.delete("/api/crm/leads/:id", authenticateToken, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'Super Admin') return res.status(403).json({ error: 'Forbidden' });
      const [rows]: any = await pool.query("SELECT name FROM leads WHERE id = ?", [req.params.id]);
      const lead = rows[0];
      await pool.query("DELETE FROM leads WHERE id = ?", [req.params.id]);
      
      // Trigger notification
      await pool.query("INSERT INTO notifications (message, type) VALUES (?, ?)", [`Lead "${lead?.name || 'Unknown'}" deleted by ${req.user.username}`, 'alert']);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // CRM: Update Lead Status
  app.put("/api/crm/leads/:id", authenticateToken, async (req: any, res) => {
    try {
      const { status } = req.body;
      const [rows]: any = await pool.query("SELECT name FROM leads WHERE id = ?", [req.params.id]);
      const lead = rows[0];
      await pool.query("UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, req.params.id]);
      
      // Trigger notification
      await pool.query("INSERT INTO notifications (message, type) VALUES (?, ?)", [`Lead "${lead?.name || 'Unknown'}" status updated to ${status} by ${req.user.username}`, 'info']);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // CRM: Assign Lead
  app.put("/api/crm/leads/:id/assign", authenticateToken, async (req: any, res) => {
    try {
      const { adminId } = req.body;
      const [leadRows]: any = await pool.query("SELECT name FROM leads WHERE id = ?", [req.params.id]);
      const lead = leadRows[0];
      const [adminRows]: any = await pool.query("SELECT username FROM admins WHERE id = ?", [adminId]);
      const admin = adminRows[0];
      
      await pool.query("UPDATE leads SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [adminId, req.params.id]);
      
      // Trigger notification
      await pool.query("INSERT INTO notifications (message, type) VALUES (?, ?)", [`Lead "${lead?.name || 'Unknown'}" assigned to ${admin?.username || 'None'} by ${req.user.username}`, 'info']);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // CRM: Delete Property
  app.delete("/api/crm/properties/:id", authenticateToken, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'Super Admin') return res.status(403).json({ error: 'Forbidden' });
      await pool.query("DELETE FROM properties WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // CRM: Add Property
  app.post("/api/crm/properties", authenticateToken, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'Super Admin') return res.status(403).json({ error: 'Forbidden' });
      const { title, price, location, type, beds, baths, sqft, image, featured, description, amenities, story_title, story_text, video_url } = req.body;
      await pool.query(
        "INSERT INTO properties (title, price, location, type, beds, baths, sqft, image, featured, description, amenities, story_title, story_text, video_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [title, price, location, type, beds, baths, sqft, image, featured ? 1 : 0, description, JSON.stringify(amenities), story_title, story_text, video_url]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // CRM: Update Property
  app.put("/api/crm/properties/:id", authenticateToken, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'Super Admin') return res.status(403).json({ error: 'Forbidden' });
      const { title, price, location, type, beds, baths, sqft, image, featured, description, amenities, story_title, story_text, video_url } = req.body;
      await pool.query(
        "UPDATE properties SET title = ?, price = ?, location = ?, type = ?, beds = ?, baths = ?, sqft = ?, image = ?, featured = ?, description = ?, amenities = ?, story_title = ?, story_text = ?, video_url = ? WHERE id = ?",
        [title, price, location, type, beds, baths, sqft, image, featured ? 1 : 0, description, JSON.stringify(amenities), story_title, story_text, video_url, req.params.id]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // CRM: Analytics
  app.get("/api/crm/analytics", authenticateToken, async (req, res) => {
    try {
      const [totalLeadsRows]: any = await pool.query("SELECT COUNT(*) as count FROM leads");
      const [abandonedLeadsRows]: any = await pool.query("SELECT COUNT(*) as count FROM leads WHERE is_abandoned = 1");
      const [convertedLeadsRows]: any = await pool.query("SELECT COUNT(*) as count FROM leads WHERE is_abandoned = 0");
      const [pageViewsRows]: any = await pool.query("SELECT COUNT(*) as count FROM events WHERE event_type = 'page_view'");
      
      res.json({
        totalLeads: totalLeadsRows[0].count,
        abandonedLeads: abandonedLeadsRows[0].count,
        convertedLeads: convertedLeadsRows[0].count,
        pageViews: pageViewsRows[0].count
      });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // CRM: Get Single Lead & Timeline
  app.get("/api/crm/leads/:id", authenticateToken, async (req, res) => {
    try {
      const [leadRows]: any = await pool.query("SELECT * FROM leads WHERE id = ?", [req.params.id]);
      const lead = leadRows[0];
      if (!lead) return res.status(404).json({ error: "Not found" });
      const [events] = await pool.query("SELECT * FROM events WHERE session_id = ? ORDER BY created_at DESC", [lead.session_id]);
      
      // Get property interest
      const [propertyViews]: any = await pool.query(`
        SELECT DISTINCT page FROM events 
        WHERE session_id = ? AND page LIKE '/property/%'
      `, [lead.session_id]);
      
      const propertyIds = propertyViews.map((v: any) => v.page.split('/').pop());
      const properties = propertyIds.length > 0 
        ? (await pool.query(`SELECT * FROM properties WHERE id IN (${propertyIds.map(() => '?').join(',')})`, propertyIds))[0]
        : [];

      res.json({ lead, events, properties });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // CRM: Lead Scoring Settings
  app.get("/api/crm/settings/scoring", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'Super Admin') return res.sendStatus(403);
      const [rows]: any = await pool.query("SELECT value FROM settings WHERE key = 'lead_scoring_weights'");
      res.json(rows.length > 0 ? JSON.parse(rows[0].value) : {});
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.put("/api/crm/settings/scoring", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'Super Admin') return res.sendStatus(403);
      const weights = req.body;
      await pool.query("INSERT INTO settings (\`key\`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)", ["lead_scoring_weights", JSON.stringify(weights)]);
      
      // Recalculate all scores
      const [leads]: any = await pool.query("SELECT session_id FROM leads");
      leads.forEach((l: any) => calculateLeadScore(l.session_id));
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // CRM: Activity Feed
  app.get("/api/crm/activity", authenticateToken, async (req: any, res) => {
    try {
      const [rows]: any = await pool.query(`
        (SELECT 'lead' as type, name, session_id, created_at, 'inquired about' as action, 'Luxury Property' as target FROM leads ORDER BY created_at DESC LIMIT 10)
        UNION ALL
        (SELECT 'event' as type, COALESCE(l.name, 'Anonymous') as name, e.session_id, e.created_at, 
          CASE 
            WHEN e.event_type = 'property_view' THEN 'viewed'
            WHEN e.event_type = 'page_view' THEN 'visited'
            WHEN e.event_type = 'brochure_download' THEN 'downloaded brochure for'
            WHEN e.event_type = 'gallery_engagement' THEN 'engaged with gallery for'
            WHEN e.event_type = 'cinematic_tour_play' THEN 'watched tour for'
            WHEN e.event_type = 'report_unlock' THEN 'unlocked market report'
            ELSE 'interacted with'
          END as action,
          e.page as target
        FROM events e
        LEFT JOIN leads l ON e.session_id = l.session_id
        WHERE e.event_type IN ('property_view', 'page_view', 'brochure_download', 'gallery_engagement', 'cinematic_tour_play', 'report_unlock')
        ORDER BY e.created_at DESC LIMIT 10)
        ORDER BY created_at DESC LIMIT 10
      `);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // CRM: System Audit
  app.get("/api/crm/audit", authenticateToken, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'Super Admin') return res.status(403).json({ error: 'Forbidden' });
      const [totalLeadsRows]: any = await pool.query("SELECT COUNT(*) as count FROM leads");
      const [missingContactRows]: any = await pool.query("SELECT COUNT(*) as count FROM leads WHERE email = '' AND phone = ''");
      const [abandonedLeadsRows]: any = await pool.query("SELECT COUNT(*) as count FROM leads WHERE is_abandoned = 1");
      
      const totalLeads = totalLeadsRows[0].count;
      const missingContact = missingContactRows[0].count;
      const abandonedLeads = abandonedLeadsRows[0].count;

      // Find sessions with > 3 page views but no lead
      const [highIntentNoLead]: any = await pool.query(`
        SELECT COUNT(*) as count FROM (
          SELECT session_id FROM events 
          WHERE session_id NOT IN (SELECT session_id FROM leads) 
          GROUP BY session_id HAVING COUNT(*) > 3
        ) as t
      `);

      res.json({
        totalLeads,
        abandonedLeads,
        missingContact,
        highIntentNoLeadCount: highIntentNoLead[0].count,
        healthScore: totalLeads > 0 ? Math.round(((totalLeads - missingContact) / totalLeads) * 100) : 100
      });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/crm/leads/:id/insights", authenticateToken, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const [leadRows]: any = await pool.query("SELECT * FROM leads WHERE id = ?", [id]);
      const lead = leadRows[0];
      if (!lead) return res.status(404).json({ error: "Lead not found" });

      const [events] = await pool.query("SELECT * FROM events WHERE session_id = ? ORDER BY created_at DESC", [lead.session_id]);
      const [properties] = await pool.query(`
        SELECT DISTINCT p.* FROM properties p
        JOIN events e ON e.data LIKE CONCAT('%', p.id, '%')
        WHERE e.session_id = ? AND e.event_type = 'property_view'
      `, [lead.session_id]);

      res.json({ lead, events, properties });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // CRM: Admin Login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const [rows]: any = await pool.query("SELECT * FROM admins WHERE username = ?", [username]);
      const admin = rows[0];
      
      if (admin && bcrypt.compareSync(password, admin.password_hash)) {
        const token = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, role: admin.role });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // CRM: Recover Abandoned Lead
  app.post("/api/crm/leads/:id/recover", authenticateToken, async (req: any, res) => {
    try {
      const [rows]: any = await pool.query("SELECT * FROM leads WHERE id = ?", [req.params.id]);
      const lead = rows[0];
      if (!lead) return res.status(404).json({ error: "Not found" });
      
      // Simulate sending an email
      console.log(`[RECOVERY EMAIL] Sent to ${lead.email || 'Unknown'} for abandoned form recovery.`);
      
      // Update lead status and add a note
      await pool.query("UPDATE leads SET status = 'Recovery Sent', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [req.params.id]);
      
      const currentNotes = lead.notes ? JSON.parse(lead.notes) : [];
      currentNotes.push({ text: `Recovery email sent by ${req.user.username}`, date: new Date().toISOString() });
      
      await pool.query("UPDATE leads SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [JSON.stringify(currentNotes), req.params.id]);
      
      // Trigger notification
      await pool.query("INSERT INTO notifications (message, type) VALUES (?, ?)", [`Recovery email sent to "${lead.name || 'Unknown'}" by ${req.user.username}`, 'info']);

      res.json({ success: true, notes: currentNotes });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // CRM: Add Note to Lead
  app.post("/api/crm/leads/:id/notes", authenticateToken, async (req, res) => {
    try {
      const { note } = req.body;
      const [rows]: any = await pool.query("SELECT notes FROM leads WHERE id = ?", [req.params.id]);
      const lead = rows[0];
      if (!lead) return res.status(404).json({ error: "Not found" });
      
      const currentNotes = lead.notes ? JSON.parse(lead.notes) : [];
      currentNotes.push({ text: note, date: new Date().toISOString() });
      
      await pool.query("UPDATE leads SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [JSON.stringify(currentNotes), req.params.id]);
        
      res.json({ success: true, notes: currentNotes });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // --- SITE CONTENT MANAGEMENT ---
  app.get("/api/content", async (req, res) => {
    try {
      const { page } = req.query;
      let query = "SELECT * FROM site_content";
      let params: any[] = [];
      
      if (page) {
        query += " WHERE page = ?";
        params.push(page);
      }
      
      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch (error) {
      console.error("/api/content error:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/content", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'Super Admin') return res.sendStatus(403);
      const { id, value } = req.body;
      await pool.query("UPDATE site_content SET value = ? WHERE id = ?", [value, id]);
      res.json({ success: true });
    } catch (error) {
      console.error("/api/content POST error:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  // --- NAVIGATION MANAGEMENT ---
  app.get("/api/navigation", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM menu_items ORDER BY order_index ASC");
      res.json(rows);
    } catch (error) {
      console.error("/api/navigation error:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/navigation", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'Super Admin') return res.sendStatus(403);
      const { id, label, url, parent_id, order_index } = req.body;
      
      if (id) {
        await pool.query("UPDATE menu_items SET label = ?, url = ?, parent_id = ?, order_index = ? WHERE id = ?", [label, url, parent_id, order_index, id]);
      } else {
        await pool.query("INSERT INTO menu_items (label, url, parent_id, order_index) VALUES (?, ?, ?, ?)", [label, url, parent_id, order_index]);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.delete("/api/navigation/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'Super Admin') return res.sendStatus(403);
      await pool.query("DELETE FROM menu_items WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // --- PAGE MANAGEMENT ---
  app.get("/api/pages", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM pages ORDER BY \`order\` ASC");
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/pages/:slug", async (req, res) => {
    try {
      const [rows]: any = await pool.query("SELECT * FROM pages WHERE slug = ?", [req.params.slug]);
      if (rows.length === 0) return res.status(404).json({ error: "Page not found" });
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/pages", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'Super Admin') return res.sendStatus(403);
      const { id, slug, title, show_header, show_footer, parent_id, order } = req.body;
      
      if (id) {
        await pool.query("UPDATE pages SET slug = ?, title = ?, show_header = ?, show_footer = ?, parent_id = ?, \`order\` = ? WHERE id = ?", [slug, title, show_header, show_footer, parent_id, order, id]);
      } else {
        await pool.query("INSERT INTO pages (slug, title, show_header, show_footer, parent_id, \`order\`) VALUES (?, ?, ?, ?, ?, ?)", [slug, title, show_header, show_footer, parent_id, order]);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.delete("/api/pages/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'Super Admin') return res.sendStatus(403);
      await pool.query("DELETE FROM pages WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // --- SECTION MANAGEMENT ---
  app.get("/api/pages/:slug/sections", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM page_sections WHERE page_slug = ? ORDER BY order_index ASC", [req.params.slug]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/pages/:slug/sections", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'Super Admin') return res.sendStatus(403);
      const { section_type, title, subtitle, content, order_index } = req.body;
      await pool.query("INSERT INTO page_sections (page_slug, section_type, title, subtitle, content, order_index) VALUES (?, ?, ?, ?, ?, ?)", [req.params.slug, section_type, title, subtitle, content, order_index]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.put("/api/pages/sections/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'Super Admin') return res.sendStatus(403);
      const { section_type, title, subtitle, content, order_index } = req.body;
      await pool.query("UPDATE page_sections SET section_type = ?, title = ?, subtitle = ?, content = ?, order_index = ? WHERE id = ?", [section_type, title, subtitle, content, order_index, req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.delete("/api/pages/sections/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'Super Admin') return res.sendStatus(403);
      await pool.query("DELETE FROM page_sections WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/pages/:slug/sections", async (req, res) => {
    try {
      const [pageRows]: any = await pool.query("SELECT id FROM pages WHERE slug = ?", [req.params.slug]);
      if (pageRows.length === 0) return res.status(404).json({ error: "Page not found" });
      
      const [sections] = await pool.query("SELECT * FROM page_sections WHERE page_id = ? ORDER BY \`order\` ASC", [pageRows[0].id]);
      res.json(sections);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/pages/:slug/sections", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'Super Admin') return res.sendStatus(403);
      const { sections } = req.body; // Array of { type, content, order }
      const [pageRows]: any = await pool.query("SELECT id FROM pages WHERE slug = ?", [req.params.slug]);
      if (pageRows.length === 0) return res.status(404).json({ error: "Page not found" });
      
      const pageId = pageRows[0].id;
      await pool.query("DELETE FROM page_sections WHERE page_id = ?", [pageId]);
      for (const section of sections) {
        await pool.query("INSERT INTO page_sections (page_id, type, content, \`order\`) VALUES (?, ?, ?, ?)", [pageId, section.type, JSON.stringify(section.content), section.order]);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/content/bulk", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'Super Admin') return res.sendStatus(403);
      const { updates } = req.body; // Array of { id, value }
      
      for (const update of updates) {
        await pool.query("UPDATE site_content SET value = ? WHERE id = ?", [update.value, update.id]);
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // --- ADMIN MANAGEMENT (Super Admin Only) ---
  app.get("/api/crm/admins", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'Super Admin') return res.sendStatus(403);
      const [rows] = await pool.query("SELECT id, username, role FROM admins");
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/crm/admins", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'Super Admin') return res.sendStatus(403);
      const { username, password, role } = req.body;
      const hash = await bcrypt.hash(password, 10);
      await pool.query("INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)", [username, hash, role]);
      res.sendStatus(201);
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.delete("/api/crm/admins/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'Super Admin') return res.sendStatus(403);
      await pool.query("DELETE FROM admins WHERE id = ?", [req.params.id]);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // --- ANALYTICS & NOTIFICATIONS ---
  app.get("/api/crm/lead-trends", authenticateToken, async (req: any, res) => {
    try {
      const [trends] = await pool.query(`
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM leads 
        GROUP BY DATE(created_at) 
        ORDER BY date ASC 
        LIMIT 30
      `);
      res.json(trends);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/crm/notifications", authenticateToken, async (req: any, res) => {
    try {
      const [notifications] = await pool.query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50");
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Recommendations based on session history
  app.get("/api/recommendations", async (req, res) => {
    try {
      const { sessionId } = req.query;
      if (!sessionId) return res.json([]);

      // Get viewed properties
      const [viewedEvents]: any = await pool.query("SELECT page FROM events WHERE session_id = ? AND page LIKE '/property/%'", [sessionId]);
      const viewedIds = viewedEvents.map((e: any) => e.page.split('/').pop()).filter((id: any) => id && !isNaN(Number(id)));

      if (viewedIds.length === 0) {
        // Return featured properties if no history
        const [featured] = await pool.query("SELECT * FROM properties WHERE featured = 1 LIMIT 3");
        return res.json(featured);
      }

      // Get details of viewed properties to find preferences
      const [viewedProps]: any = await pool.query(`SELECT type, location FROM properties WHERE id IN (${viewedIds.map(() => '?').join(',')})`, viewedIds);

      const types = [...new Set(viewedProps.map((p: any) => p.type))];
      const locations = [...new Set(viewedProps.map((p: any) => p.location))];

      // Find similar properties not yet viewed
      const recommendations = await pool.query(`
        SELECT * FROM properties 
        WHERE (type IN (${types.map(() => '?').join(',')}) OR location IN (${locations.map(() => '?').join(',')}))
        AND id NOT IN (${viewedIds.map(() => '?').join(',')})
        LIMIT 4
      `, [...types, ...locations, ...viewedIds]);

      res.json(recommendations[0]);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
