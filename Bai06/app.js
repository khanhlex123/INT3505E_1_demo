const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(express.json());

const DB_FILE = path.join(__dirname, "library.db");

// ------------------------------
// Hàm tiện ích
// ------------------------------
function queryDb(query, params = []) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_FILE);
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
            db.close();
        });
    });
}

function queryDbOne(query, params = []) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_FILE);
        db.get(query, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
            db.close();
        });
    });
}

// ------------------------------
// Endpoint: Lấy danh sách sách + tìm kiếm + phân trang
// ------------------------------
app.get("/books", async (req, res) => {
    try {
        const author = req.query.author;
        const category = req.query.category;
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        let query = "SELECT * FROM Book WHERE 1=1";
        let params = [];

        if (author) {
            query += " AND author LIKE ?";
            params.push(`%${author}%`);
        }
        if (category) {
            query += " AND category LIKE ?";
            params.push(`%${category}%`);
        }

        query += " LIMIT ? OFFSET ?";
        params.push(limit, offset);

        const books = await queryDb(query, params);

        res.json({
            limit: limit,
            offset: offset,
            count: books.length,
            data: books
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ------------------------------
// Endpoint: Lấy thông tin 1 sách
// ------------------------------
app.get("/books/:book_id", async (req, res) => {
    try {
        const bookId = parseInt(req.params.book_id);
        const book = await queryDbOne("SELECT * FROM Book WHERE id = ?", [bookId]);
        
        if (book) {
            res.json(book);
        } else {
            res.status(404).json({ error: "Book not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ------------------------------
// Endpoint: Lấy danh sách phiếu mượn của 1 thành viên
// ------------------------------
app.get("/members/:member_id/loans", async (req, res) => {
    try {
        const memberId = parseInt(req.params.member_id);
        const status = req.query.status;
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        let query = "SELECT * FROM Loan WHERE member_id = ?";
        let params = [memberId];

        if (status) {
            query += " AND status = ?";
            params.push(status);
        }

        query += " LIMIT ? OFFSET ?";
        params.push(limit, offset);

        const loans = await queryDb(query, params);
        
        res.json({
            member_id: memberId,
            limit: limit,
            offset: offset,
            data: loans
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ------------------------------
// Khởi tạo DB & chạy app
// ------------------------------
function initDb() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_FILE);
        
        db.serialize(() => {
            // Tạo bảng Book
            db.run(`CREATE TABLE IF NOT EXISTS Book (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                author TEXT,
                category TEXT,
                status TEXT
            )`);
            
            // Tạo bảng Member
            db.run(`CREATE TABLE IF NOT EXISTS Member (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT
            )`);
            
            // Tạo bảng Librarian
            db.run(`CREATE TABLE IF NOT EXISTS Librarian (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT,
                employee_code TEXT
            )`);
            
            // Tạo bảng Loan
            db.run(`CREATE TABLE IF NOT EXISTS Loan (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                book_id INTEGER,
                member_id INTEGER,
                librarian_id INTEGER,
                borrow_date TEXT,
                return_date TEXT,
                status TEXT,
                FOREIGN KEY (book_id) REFERENCES Book(id),
                FOREIGN KEY (member_id) REFERENCES Member(id),
                FOREIGN KEY (librarian_id) REFERENCES Librarian(id)
            )`);
        });
        
        db.close((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function seedData() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_FILE);
        
        db.serialize(() => {
            // Xóa dữ liệu cũ
            db.run("DELETE FROM Loan");
            db.run("DELETE FROM Member");
            db.run("DELETE FROM Book");
            db.run("DELETE FROM Librarian");

            // Thêm dữ liệu Book
            const books = [
                ['Dế Mèn Phiêu Lưu Ký', 'Tô Hoài', 'Thiếu nhi', 'available'],
                ['O Chuột', 'Tô Hoài', 'Văn học', 'borrowed'],
                ['Harry Potter and the Philosopher\'s Stone', 'J.K. Rowling', 'Fantasy', 'available'],
                ['To Kill a Mockingbird', 'Harper Lee', 'Classic', 'available'],
                ['The Great Gatsby', 'F. Scott Fitzgerald', 'Classic', 'borrowed']
            ];
            
            const stmt1 = db.prepare("INSERT INTO Book (title, author, category, status) VALUES (?, ?, ?, ?)");
            books.forEach(book => stmt1.run(book));
            stmt1.finalize();

            // Thêm dữ liệu Member
            const members = [
                ['Nguyễn Văn A', 'vana@example.com'],
                ['Trần Thị B', 'thib@example.com'],
                ['Lê Văn C', 'vanc@example.com']
            ];
            
            const stmt2 = db.prepare("INSERT INTO Member (name, email) VALUES (?, ?)");
            members.forEach(member => stmt2.run(member));
            stmt2.finalize();

            // Thêm dữ liệu Librarian
            const librarians = [
                ['Phạm Thị Thư', 'thu.librarian@example.com', 'EMP001'],
                ['Ngô Văn Minh', 'minh.lib@example.com', 'EMP002']
            ];
            
            const stmt3 = db.prepare("INSERT INTO Librarian (name, email, employee_code) VALUES (?, ?, ?)");
            librarians.forEach(librarian => stmt3.run(librarian));
            stmt3.finalize();

            // Thêm dữ liệu Loan
            const loans = [
                [1, 1, '2025-10-01', '2025-10-10', 'returned'],
                [2, 1, '2025-10-05', null, 'borrowed'],
                [5, 2, '2025-10-07', null, 'overdue']
            ];
            
            const stmt4 = db.prepare("INSERT INTO Loan (book_id, member_id, borrow_date, return_date, status) VALUES (?, ?, ?, ?, ?)");
            loans.forEach(loan => stmt4.run(loan));
            stmt4.finalize();
        });
        
        db.close((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

// Khởi tạo và chạy server
async function startServer() {
    try {
        await initDb();
        await seedData();
        
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server đang chạy tại http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Lỗi khởi tạo server:', error);
    }
}

startServer();

