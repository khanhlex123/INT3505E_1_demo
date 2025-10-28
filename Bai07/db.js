const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'nplus1.db');
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function seed() {
  await run('PRAGMA foreign_keys = ON');
  await run('DROP TABLE IF EXISTS reviews');
  await run('DROP TABLE IF EXISTS books');
  await run(`CREATE TABLE books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL
  )`);
  await run(`CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    FOREIGN KEY(book_id) REFERENCES books(id)
  )`);
  await run('CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id)');

  const totalBooks = 200;
  const reviewsPerBook = 5;

  await run('BEGIN TRANSACTION');
  for (let i = 1; i <= totalBooks; i++) {
    await run('INSERT INTO books (title, author) VALUES (?, ?)', [
      `Book ${i}`,
      `Author ${Math.ceil(i / 10)}`
    ]);
  }
  for (let i = 1; i <= totalBooks; i++) {
    for (let j = 1; j <= reviewsPerBook; j++) {
      await run('INSERT INTO reviews (book_id, rating, comment) VALUES (?, ?, ?)', [
        i,
        1 + ((i + j) % 5),
        `Review ${j} for book ${i}`
      ]);
    }
  }
  await run('COMMIT');
}

module.exports = { db, run, all, get, seed };


