require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const branchRoutes = require('./routes/branch.routes');
const tableRoutes = require('./routes/table.routes');
const menuRoutes = require('./routes/menu.routes');
const reservationRoutes = require('./routes/reservation.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const userRoutes = require('./routes/user.routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'KingBeef Steak & Pasta House API',
    timestamp: new Date().toISOString(),
  });
});

// Mount RESTful API routes
app.use('/api/auth', authRoutes);
app.use('/api', branchRoutes); // /api/branches, /api/halls, /api/halls/:hallId/tables
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ message: `Không tìm thấy API endpoint: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`KingBeef API Server dang chay tai http://localhost:${PORT}`);
});
