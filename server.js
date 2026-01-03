
/**
 * DAYFLOW BACKEND SERVER (EXPRESS + MONGODB)
 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// --- MODELS ---

const UserSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['HR', 'EMPLOYEE'], default: 'EMPLOYEE' },
  department: String,
  jobTitle: String,
  salary: { type: Number, default: 0 }, // Annual CTC in INR
  paidLeaveRemaining: { type: Number, default: 12 } // Tracker for issue #4
});

const SalaryStructureSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  basicSalary: { type: Number, default: 0 },
  hra: { type: Number, default: 0 },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

const LeaveRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  type: { type: String, enum: ['Paid', 'Sick', 'Unpaid'], required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  remarks: String,
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  adminComment: String
});

const User = mongoose.model('User', UserSchema);
const SalaryStructure = mongoose.model('SalaryStructure', SalaryStructureSchema);
const LeaveRequest = mongoose.model('LeaveRequest', LeaveRequestSchema);

// --- MIDDLEWARE ---
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (e) {
    res.status(400).json({ msg: 'Token is not valid' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'HR') return res.status(403).json({ msg: 'Admin access required' });
  next();
};

// --- ROUTES ---

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User does not exist' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, salary: user.salary, paidLeaveRemaining: user.paidLeaveRemaining } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leave: Update Status (HR Only)
app.put('/api/leaves/:id', [auth, isAdmin], async (req, res) => {
  const { status, adminComment } = req.body;
  
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: 'Leave request not found' });
    
    // BUSINESS LOGIC: Deduct balance on approval
    if (status === 'Approved' && leave.type === 'Paid') {
      const user = await User.findById(leave.userId);
      
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (user.paidLeaveRemaining < diffDays) {
        return res.status(400).json({ msg: `Insufficient leave balance. User only has ${user.paidLeaveRemaining} days.` });
      }

      user.paidLeaveRemaining -= diffDays;
      await user.save();
    }

    leave.status = status;
    leave.adminComment = adminComment;
    await leave.save();
    
    res.json(leave);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Seed Script Helper
app.post('/api/dev/seed', async (req, res) => {
  const salt = await bcrypt.genSalt(10);
  const pass = await bcrypt.hash('pass', salt);
  await User.deleteMany({});
  await SalaryStructure.deleteMany({});
  await LeaveRequest.deleteMany({});
  
  const admin = await User.create({ employeeId: 'EMP001', name: 'HR Admin', email: 'admin@dayflow.com', password: pass, role: 'HR', salary: 1200000, paidLeaveRemaining: 15 });
  const emp = await User.create({ employeeId: 'EMP002', name: 'Sarah Tech', email: 'sarah@dayflow.com', password: pass, role: 'EMPLOYEE', salary: 900000, paidLeaveRemaining: 12 });
  
  await SalaryStructure.create([
    { userId: admin._id, basicSalary: 50000, hra: 20000, allowances: 30000, deductions: 2500, netSalary: 97500 },
    { userId: emp._id, basicSalary: 37500, hra: 15000, allowances: 22500, deductions: 2500, netSalary: 72500 }
  ]);
  
  res.send('Database Seeded with Enhanced Leave Balances');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Dayflow Server running on port ${PORT}`));
