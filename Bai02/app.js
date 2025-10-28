const express = require('express');
const app = express();

// Middleware để parse JSON
app.use(express.json());

// Dữ liệu sách lưu trong object, key là id
let books = {
    1: {"title": "Python co ban", "author": "Nguyen Van A", "available": true},
    2: {"title": "Giai thuat lap trinh", "author": "TTran Van B", "available": true},
};

// -------------------------------
// API endpoints
// -------------------------------

// Lấy danh sách tất cả sách
app.get("/books", (req, res) => {
    const booksList = Object.keys(books).map(bookId => ({
        id: parseInt(bookId),
        ...books[bookId]
    }));
    res.json(booksList);
});

// Lấy thông tin 1 cuốn sách
app.get("/books/:book_id", (req, res) => {
    const bookId = parseInt(req.params.book_id);
    if (!books[bookId]) {
        return res.status(404).send("Không tìm thấy sách");
    }
    res.json({id: bookId, ...books[bookId]});
});

// Tìm sách theo tên
app.get("/search", (req, res) => {
    const query = (req.query.title || "").toLowerCase();
    const results = Object.keys(books)
        .map(bookId => ({id: parseInt(bookId), ...books[bookId]}))
        .filter(book => book.title.toLowerCase().includes(query));
    res.json(results);
});

// Thêm sách mới
app.post("/books", (req, res) => {
    const data = req.body;
    if (!data || !data.title || !data.author) {
        return res.status(400).send("Thiếu dữ liệu");
    }

    const newId = Math.max(...Object.keys(books).map(Number), 0) + 1;
    books[newId] = {
        title: data.title,
        author: data.author,
        available: true,
    };
    res.status(201).json({id: newId, ...books[newId]});
});

// Cập nhật thông tin sách
app.put("/books/:book_id", (req, res) => {
    const bookId = parseInt(req.params.book_id);
    if (!books[bookId]) {
        return res.status(404).send("Không tìm thấy sách");
    }
    
    const data = req.body;
    const allowedFields = ["title", "author", "available"];
    allowedFields.forEach(field => {
        if (data[field] !== undefined) {
            books[bookId][field] = data[field];
        }
    });
    res.json({id: bookId, ...books[bookId]});
});

// Xóa sách
app.delete("/books/:book_id", (req, res) => {
    const bookId = parseInt(req.params.book_id);
    if (!books[bookId]) {
        return res.status(404).send("Không tìm thấy sách");
    }
    
    delete books[bookId];
    res.status(200).send("Xóa thành công");
});

// Cập nhật trạng thái sách (mượn hoặc trả)
app.post("/books/:book_id/status", (req, res) => {
    const bookId = parseInt(req.params.book_id);
    if (!books[bookId]) {
        return res.status(404).send("Không tìm thấy sách");
    }

    const action = req.body.action;
    if (action === "borrow") {
        if (!books[bookId].available) {
            return res.status(400).send("Sách đã được mượn");
        }
        books[bookId].available = false;
    } else if (action === "return") {
        if (books[bookId].available) {
            return res.status(400).send("Sách chưa được mượn");
        }
        books[bookId].available = true;
    } else {
        return res.status(400).send("Hành động không hợp lệ");
    }

    res.json({id: bookId, ...books[bookId]});
});

// -------------------------------
// Run server
// -------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

