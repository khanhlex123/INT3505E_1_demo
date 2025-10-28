// server.js (Phiên bản NÂNG CẤP)
const express = require('express');

// --- 1. IMPORT CÁC THƯ VIỆN MỚI ---
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
const port = 3000;

// file yaml
const swaggerDocument = YAML.load('./test.yaml');

// Endpoint phục vụ giao diện Swagger UI
app.use(
  '/api-docs',
  swaggerUi.serve, 
  swaggerUi.setup(swaggerDocument)
);
// ===================================================================
//  PHẦN API MÁY TÍNH (Giữ nguyên từ demo trước)
// ===================================================================

const validateNumbers = (req, res, next) => {
  const { a, b } = req.query;
  if (!a || !b) {
    return res.status(400).json({ error: "Tham số 'a' và 'b' là bắt buộc." });
  }
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  if (isNaN(numA) || isNaN(numB)) {
    return res.status(400).json({ error: "Tham số 'a' và 'b' phải là số." });
  }
  req.numA = numA;
  req.numB = numB;
  next();
};

app.get('/add', validateNumbers, (req, res) => {
  const { numA, numB } = req;
  const result = numA + numB;
  console.log(`LOG: Thực hiện phép cộng ${numA} + ${numB} = ${result}`);
  res.status(200).json({
    operation: "add",
    a: numA,
    b: numB,
    result: result
  });
});

app.get('/subtract', validateNumbers, (req, res) => {
  const { numA, numB } = req;
  const result = numA - numB;
  console.log(`LOG: Thực hiện phép trừ ${numA} - ${numB} = ${result}`);
  res.status(200).json({
    operation: "subtract",
    a: numA,
    b: numB,
    result: result
  });
});

// ===================================================================
//  KHỞI ĐỘNG SERVER
// ===================================================================
app.listen(port, () => {
  console.log(`\nServer đang chạy tại http://localhost:${port}`);
  console.log('--------------------------------------------------');
  console.log('>>> Giao diện API tương tác (Swagger UI) có tại: http://localhost:3000/api-docs <<<');
});