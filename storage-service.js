#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FileStorageService {
  constructor() {
    this.storageFile = path.join(__dirname, 'storage.json');
  }

  // Read expenses from JSON file
  readExpenses() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = fs.readFileSync(this.storageFile, 'utf8');
        const parsed = JSON.parse(data);
        return parsed.expenses || [];
      }
      return [];
    } catch (error) {
      console.error('Error reading expenses:', error);
      return [];
    }
  }

  // Write expenses to JSON file
  writeExpenses(expenses) {
    try {
      const data = { expenses };
      fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2));
      console.log(`✅ Expenses saved to ${this.storageFile}`);
      return true;
    } catch (error) {
      console.error('Error writing expenses:', error);
      return false;
    }
  }

  // Add a new expense
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

  // Update an existing expense
  updateExpense(expenseId, updates) {
    const expenses = this.readExpenses();
    const index = expenses.findIndex(exp => exp.id === expenseId);
    if (index !== -1) {
      expenses[index] = { ...expenses[index], ...updates };
      return this.writeExpenses(expenses);
    }
    return false;
  }

  // Delete an expense
  deleteExpense(expenseId) {
    const expenses = this.readExpenses();
    const index = expenses.findIndex(exp => exp.id === expenseId);
    if (index !== -1) {
      expenses.splice(index, 1);
      console.log(`✅ Deleted expense ${expenseId} from storage`);
      return this.writeExpenses(expenses);
    }
    return false;
  }

  // Reset to default expenses
  resetToDefault() {
    const defaultExpenses = [
      {
        id: 'exp_101',
        description: 'Laptop accessories',
        amount: 150,
        date: '2024-01-15',
        status: 'Pending',
        submittedBy: 'dina_dev',
        department: 'Engineering',
        category: 'Equipment'
      },
      {
        id: 'exp_102',
        description: 'Conference registration',
        amount: 300,
        date: '2024-01-20',
        status: 'Pending',
        submittedBy: 'dina_dev',
        department: 'Engineering',
        category: 'Training'
      },
      {
        id: 'exp_201',
        description: 'Team lunch',
        amount: 200,
        date: '2024-01-25',
        status: 'Pending',
        submittedBy: 'raj_manager',
        department: 'Engineering',
        category: 'Meals'
      },
      {
        id: 'exp_301',
        description: 'Software licenses',
        amount: 1200,
        date: '2024-02-01',
        status: 'Pending',
        submittedBy: 'chen_vp',
        department: 'Engineering',
        category: 'Software'
      },
      {
        id: 'exp_401',
        description: 'Financial audit tools',
        amount: 500,
        date: '2024-02-05',
        status: 'Pending',
        submittedBy: 'frank_finance',
        department: 'Finance',
        category: 'Tools'
      }
    ];
    return this.writeExpenses(defaultExpenses);
  }

  // List all expenses
  listExpenses() {
    const expenses = this.readExpenses();
    console.log(`📊 Found ${expenses.length} expenses:`);
    expenses.forEach(exp => {
      console.log(`  - ${exp.id}: ${exp.description} ($${exp.amount}) - ${exp.status}`);
    });
    return expenses;
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

if (command) {
  const service = new FileStorageService();

  switch (command) {
    case 'list':
      service.listExpenses();
      break;
    case 'reset':
      service.resetToDefault();
      console.log('✅ Reset to default expenses');
      break;
    case 'add':
      const expenseData = args[1];
      if (expenseData) {
        try {
          const expense = JSON.parse(expenseData);
          service.addExpense(expense);
          console.log('✅ Expense added successfully');
        } catch (error) {
          console.error('❌ Invalid expense data:', error.message);
        }
      } else {
        console.log('Usage: node storage-service.js add \'{"id":"exp_103","description":"Test","amount":100,...}\'');
      }
      break;
    case 'delete':
      const expenseId = args[1];
      if (expenseId) {
        const success = service.deleteExpense(expenseId);
        if (success) {
          console.log(`✅ Expense ${expenseId} deleted successfully`);
        } else {
          console.log(`❌ Expense ${expenseId} not found`);
        }
      } else {
        console.log('Usage: node storage-service.js delete <expense-id>');
      }
      break;
    default:
      console.log('Available commands:');
      console.log('  list   - List all expenses');
      console.log('  reset  - Reset to default expenses');
      console.log('  add    - Add a new expense (with JSON data)');
      console.log('  delete - Delete an expense by ID');
  }
}

export default FileStorageService; 