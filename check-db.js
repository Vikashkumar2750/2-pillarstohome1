import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.all("SELECT * FROM site_content WHERE `key` IN ('address', 'phone', 'email', 'company_name')", (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      console.log(rows);
    }
  });
});

db.close();
