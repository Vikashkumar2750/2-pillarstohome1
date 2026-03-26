-- Pillars to Home - MySQL Database Schema
-- Exported for Hostinger Deployment

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for properties
-- ----------------------------
CREATE TABLE IF NOT EXISTS `properties` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `price` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `beds` int(11) DEFAULT NULL,
  `baths` int(11) DEFAULT NULL,
  `sqft` int(11) DEFAULT NULL,
  `image` text DEFAULT NULL,
  `featured` tinyint(1) DEFAULT 0,
  `description` text DEFAULT NULL,
  `amenities` json DEFAULT NULL,
  `story_title` varchar(255) DEFAULT NULL,
  `story_text` text DEFAULT NULL,
  `video_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for leads
-- ----------------------------
CREATE TABLE IF NOT EXISTS `leads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'New',
  `type` varchar(50) DEFAULT 'Inquiry',
  `property_title` varchar(255) DEFAULT NULL,
  `tour_date` date DEFAULT NULL,
  `tour_time` varchar(50) DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `is_abandoned` tinyint(1) DEFAULT 1,
  `notes` text DEFAULT NULL,
  `budget` varchar(100) DEFAULT NULL,
  `intent` varchar(100) DEFAULT NULL,
  `score` int(11) DEFAULT 0,
  `assigned_to` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for events
-- ----------------------------
CREATE TABLE IF NOT EXISTS `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(255) DEFAULT NULL,
  `lead_id` int(11) DEFAULT NULL,
  `event_type` varchar(100) DEFAULT NULL,
  `page` varchar(255) DEFAULT NULL,
  `data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for admins
-- ----------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for notifications
-- ----------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message` text DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for settings
-- ----------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for site_content
-- ----------------------------
CREATE TABLE IF NOT EXISTS `site_content` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `page` varchar(100) NOT NULL,
  `section` varchar(100) NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  `type` varchar(50) DEFAULT 'text',
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `page_section_key` (`page`,`section`,`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for pages
-- ----------------------------
CREATE TABLE IF NOT EXISTS `pages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `show_header` tinyint(1) DEFAULT 1,
  `show_footer` tinyint(1) DEFAULT 1,
  `parent_id` int(11) DEFAULT NULL,
  `order` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for menu_items
-- ----------------------------
CREATE TABLE IF NOT EXISTS `menu_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `label` varchar(255) NOT NULL,
  `url` varchar(255) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `order_index` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for page_sections
-- ----------------------------
CREATE TABLE IF NOT EXISTS `page_sections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `page_slug` varchar(255) NOT NULL,
  `section_type` varchar(100) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `order_index` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Initial Data Seeding
-- ----------------------------

INSERT INTO `pages` (`slug`, `title`, `show_header`, `show_footer`, `parent_id`, `order`) VALUES 
('home', 'Home', 1, 1, NULL, 0),
('listings', 'Properties', 1, 1, NULL, 1),
('investment', 'Investment', 1, 1, NULL, 2),
('about', 'About', 1, 1, NULL, 3),
('contact', 'Contact', 1, 1, NULL, 4),
('privacy', 'Privacy Policy', 1, 1, NULL, 5),
('terms', 'Terms of Service', 1, 1, NULL, 6),
('sitemap', 'Sitemap', 1, 1, NULL, 7);

INSERT INTO `menu_items` (`label`, `url`, `parent_id`, `order_index`) VALUES 
('Home', '/', NULL, 0),
('Properties', '/listings', NULL, 1),
('Investment', '/investment', NULL, 2),
('About', '/about', NULL, 3),
('Contact', '/contact', NULL, 4);

INSERT INTO `site_content` (`page`, `section`, `key`, `value`, `type`, `description`) VALUES 
('home', 'hero', 'title', 'Discover Exceptional <br/> <span class=\"text-gold-500 italic\">Living Spaces</span>', 'html', 'Main hero title'),
('home', 'hero', 'subtitle', 'Curating the world\'s most prestigious real estate for the discerning investor. From Dubai penthouses to London estates.', 'text', 'Hero subtitle'),
('home', 'hero', 'cta_text', 'Explore Collection', 'text', 'Hero CTA button text'),
('home', 'hero', 'cta_link', '/listings', 'text', 'Hero CTA button link'),
('home', 'hero', 'video_url', 'https://www.youtube.com/watch?v=0k_v9E_7v6c', 'text', 'Hero background video/modal URL'),
('home', 'hero', 'image', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80', 'image', 'Hero background image'),
('global', 'theme', 'header_style', 'transparent', 'text', 'Header style (transparent, solid_dark, solid_light)'),
('global', 'theme', 'footer_style', 'dark', 'text', 'Footer style (dark, light, minimal)'),
('global', 'footer', 'company_name', 'PillarstoHome Real Estate', 'text', 'Company name in footer'),
('global', 'footer', 'address', '3039p Sector 57, Hong Kong Bazaar', 'text', 'Office address'),
('global', 'contact', 'phone', '+919911414220', 'text', 'Contact phone number'),
('global', 'contact', 'email', 'Pillarstohome57@gmail.com', 'text', 'Contact email address');

-- Default Admins (passwords: admin123 and agent123)
INSERT INTO `admins` (`username`, `password_hash`, `role`) VALUES 
('admin', '$2b$10$yrusqUvWSdx8RAxi3lM0n.7sTV3Zy6iDq2q9k2pHEcJdU3AHod.vW', 'Super Admin'),
('agent', '$2b$10$tkEj90KmbiDsL2Mh1W1nLeWKL0f.KNGGpxzTReoqaFUGQn3CTcWk2', 'Sales Agent');

SET FOREIGN_KEY_CHECKS = 1;
