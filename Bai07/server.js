const express = require('express');
const { all, get, seed } = require('./db');

const app = express();
const PORT = process.env.PORT || 3007;

app.get('/seed', async (req, res) => {
  try {
    await seed();
    res.json({ message: 'Seeded database' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// N+1 naive: get all books, then query reviews per book individually
app.get('/books-n-plus-1', async (req, res) => {
  try {
    const books = await all('SELECT id, title, author FROM books');
    const result = [];
    for (const book of books) {
      const reviews = await all('SELECT rating, comment FROM reviews WHERE book_id = ?', [book.id]);
      result.push({ ...book, reviews });
    }
    res.json({ count: result.length, data: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fix 1: JOIN + GROUP_CONCAT to aggregate reviews per book in one query
app.get('/books-join', async (req, res) => {
  try {
    const rows = await all(`
      SELECT b.id, b.title, b.author,
             GROUP_CONCAT(r.rating) AS ratings,
             GROUP_CONCAT(COALESCE(r.comment, '')) AS comments
      FROM books b
      LEFT JOIN reviews r ON r.book_id = b.id
      GROUP BY b.id
      ORDER BY b.id
    `);
    const data = rows.map(r => ({
      id: r.id,
      title: r.title,
      author: r.author,
      reviews: (r.ratings ? r.ratings.split(',').map((rating, idx) => ({
        rating: Number(rating),
        comment: r.comments ? r.comments.split(',')[idx] : ''
      })) : [])
    }));
    res.json({ count: data.length, data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fix 2: IN-batch: 2 queries — one for books, one for all reviews of those books, then map
app.get('/books-batch', async (req, res) => {
  try {
    const books = await all('SELECT id, title, author FROM books');
    if (books.length === 0) return res.json({ count: 0, data: [] });
    const ids = books.map(b => b.id);
    const placeholders = ids.map(() => '?').join(',');
    const reviews = await all(`SELECT book_id, rating, comment FROM reviews WHERE book_id IN (${placeholders})`, ids);

    const bookIdToReviews = new Map();
    for (const id of ids) bookIdToReviews.set(id, []);
    for (const rv of reviews) {
      bookIdToReviews.get(rv.book_id).push({ rating: rv.rating, comment: rv.comment });
    }

    const data = books.map(b => ({ ...b, reviews: bookIdToReviews.get(b.id) }));
    res.json({ count: data.length, data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// (route '/books-avg' sẽ được thêm ở commit tiếp theo)
// Optional: average rating per book using aggregation
app.get('/books-avg', async (req, res) => {
  try {
    const rows = await all(`
      SELECT b.id, b.title, b.author, AVG(r.rating) AS avg_rating, COUNT(r.id) as review_count
      FROM books b
      LEFT JOIN reviews r ON r.book_id = b.id
      GROUP BY b.id
      ORDER BY b.id
    `);
    res.json({ count: rows.length, data: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

if (process.argv.includes('--seed')) {
  seed().then(() => {
    console.log('Seeded database');
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
} else {
  app.listen(PORT, () => {
    console.log(`Bai07 server listening on http://localhost:${PORT}`);
    console.log('Use /seed to initialize sample data');
  });
}


