const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // Cho phép Swagger UI (chạy khác port) gọi được API này
app.use(express.json());

// Cơ sở dữ liệu mẫu
let BOOKS = [
    {"id": 1, "title": "Clean Code", "author": "Robert C. Martin", "year": 2008},
    {"id": 2, "title": "The Pragmatic Programmer", "author": "Andrew Hunt", "year": 1999},
    {"id": 3, "title": "Refactoring", "author": "Martin Fowler", "year": 1999}
];

// Lấy danh sách tất cả sách (có thể lọc & giới hạn)
app.get('/api/books', (req, res) => {
    const author = req.query.author;
    const limit = parseInt(req.query.limit) || 10;
    let books = BOOKS;
    
    if (author) {
        books = books.filter(b => b.author.toLowerCase().includes(author.toLowerCase()));
    }
    
    res.json(books.slice(0, limit));
});

// Lấy thông tin sách theo ID
app.get('/api/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const book = BOOKS.find(b => b.id === id);
    
    if (book) {
        res.json(book);
    } else {
        res.status(404).json({"message": "Không tìm thấy"});
    }
});

// Thêm sách mới
app.post('/api/books', (req, res) => {
    const data = req.body;
    const newBook = {
        id: BOOKS.length + 1,
        title: data.title,
        author: data.author,
        year: data.year
    };
    BOOKS.push(newBook);
    res.status(201).json(newBook);
});

// Cập nhật thông tin sách
app.put('/api/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const data = req.body;
    const bookIndex = BOOKS.findIndex(b => b.id === id);
    
    if (bookIndex !== -1) {
        BOOKS[bookIndex] = { ...BOOKS[bookIndex], ...data };
        res.json(BOOKS[bookIndex]);
    } else {
        res.status(404).json({"message": "Không tìm thấy"});
    }
});

// Xóa sách
app.delete('/api/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const bookIndex = BOOKS.findIndex(b => b.id === id);
    
    if (bookIndex !== -1) {
        BOOKS.splice(bookIndex, 1);
        res.status(204).send('');
    } else {
        res.status(404).json({"message": "Không tìm thấy"});
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

