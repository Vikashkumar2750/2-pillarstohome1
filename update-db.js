import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run("UPDATE site_content SET value = '3039p Sector 57, Hong Kong Bazaar' WHERE page = 'global' AND section = 'footer' AND \`key\` = 'address'");
  db.run("UPDATE site_content SET value = '+919911414220' WHERE page = 'global' AND section = 'contact' AND \`key\` = 'phone'");
  db.run("UPDATE site_content SET value = 'Pillarstohome57@gmail.com' WHERE page = 'global' AND section = 'contact' AND \`key\` = 'email'");
  
  // Also check if navbar_company_name exists, if not, let's insert it so it can be edited via admin panel
  db.get("SELECT * FROM site_content WHERE page = 'global' AND section = 'navbar' AND \`key\` = 'company_name'", (err, row) => {
    if (!row) {
      db.run("INSERT INTO site_content (page, section, \`key\`, value, type, description) VALUES ('global', 'navbar', 'company_name', 'PillarstoHome', 'text', 'Company name in header logo')");
    }
  });
});

db.close(() => {
  console.log("Database updated");
});
