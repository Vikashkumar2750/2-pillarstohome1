import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./database.sqlite');
db.all("PRAGMA table_info(site_content)", (err, rows) => {
  if (err) console.error(err);
  else console.log(rows);
  db.close();
});
