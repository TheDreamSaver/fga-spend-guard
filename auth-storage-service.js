import fs from 'fs';
import path from 'path';

class AuthStorageService {
  constructor() {
    this.storageFile = path.join(process.cwd(), 'auth-storage.json');
    this.initializeStorage();
  }

  initializeStorage() {
    if (!fs.existsSync(this.storageFile)) {
      console.log('📁 Creating new authenticated storage file');
      this.writeExpenses([]);
    } else {
      console.log('📁 Using existing authenticated storage file');
    }
  }

  readExpenses() {
    try {
      const data = fs.readFileSync(this.storageFile, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.expenses || [];
    } catch (error) {
      console.error('Error reading authenticated expenses:', error);
      return [];
    }
  }

  writeExpenses(expenses) {
    try {
      const data = { expenses };
      fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2));
      console.log('✅ Authenticated expenses saved to', this.storageFile);
      return true;
    } catch (error) {
      console.error('Error writing authenticated expenses:', error);
      return false;
    }
  }

  addExpense(expense) {
    const expenses = this.readExpenses();
    
    // Check if expense with same ID already exists
    const existingExpense = expenses.find(e => e.id === expense.id);
    if (existingExpense) {
      console.log(`⚠️ Expense with ID ${expense.id} already exists, updating instead of creating duplicate`);
      // Update the existing expense instead of creating a duplicate
      const index = expenses.findIndex(e => e.id === expense.id);
      expenses[index] = expense;
    } else {
      // Add new expense
      expenses.push(expense);
    }
    
    return this.writeExpenses(expenses);
  }

  updateExpense(expenseId, updates) {
    const expenses = this.readExpenses();
    const index = expenses.findIndex(e => e.id === expenseId);
    
    if (index !== -1) {
      expenses[index] = { ...expenses[index], ...updates };
      return this.writeExpenses(expenses);
    }
    
    return false;
  }

  deleteExpense(expenseId) {
    const expenses = this.readExpenses();
    const filteredExpenses = expenses.filter(e => e.id !== expenseId);
    
    if (filteredExpenses.length < expenses.length) {
      return this.writeExpenses(filteredExpenses);
    }
    
    return false;
  }

  getExpense(expenseId) {
    const expenses = this.readExpenses();
    return expenses.find(e => e.id === expenseId);
  }

  getAllExpenses() {
    return this.readExpenses();
  }
}

export default new AuthStorageService();
