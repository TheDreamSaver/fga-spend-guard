import express from 'express';
import cors from 'cors';
import FileStorageService from './storage-service.js';

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize storage service
const storageService = new FileStorageService();

// API Routes
app.get('/api/expenses', (req, res) => {
  try {
    const expenses = storageService.readExpenses();
    res.json({ expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.post('/api/expenses', (req, res) => {
  try {
    const expense = req.body;
    const success = storageService.addExpense(expense);
    if (success) {
      res.json({ message: 'Expense added successfully', expense });
    } else {
      res.status(500).json({ error: 'Failed to add expense' });
    }
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

app.put('/api/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const success = storageService.updateExpense(id, updates);
    if (success) {
      res.json({ message: 'Expense updated successfully' });
    } else {
      res.status(404).json({ error: 'Expense not found' });
    }
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

app.delete('/api/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = storageService.deleteExpense(id);
    if (success) {
      res.json({ message: 'Expense deleted successfully' });
    } else {
      res.status(404).json({ error: 'Expense not found' });
    }
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

app.post('/api/expenses/reset', (req, res) => {
  try {
    const success = storageService.resetToDefault();
    if (success) {
      res.json({ message: 'Expenses reset to default' });
    } else {
      res.status(500).json({ error: 'Failed to reset expenses' });
    }
  } catch (error) {
    console.error('Error resetting expenses:', error);
    res.status(500).json({ error: 'Failed to reset expenses' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Storage API server running on http://localhost:${port}`);
  console.log(`📁 Using storage file: ${storageService.storageFile}`);
});

export default app; 