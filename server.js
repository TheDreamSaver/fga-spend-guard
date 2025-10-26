import express from 'express';
import cors from 'cors';
import FileStorageService from './storage-service.js';
import openfgaService from './openfga-service.js';
import authStorageService from './auth-storage-service.js';
import authOpenfgaService from './auth-openfga-service.js';
import { CredentialsMethod, OpenFgaClient } from '@openfga/sdk';

// OpenFGA Configuration for Auth0 FGA (Demo Mode)
const OPENFGA_CONFIG = {
  apiUrl: 'https://api.us1.fga.dev',
  storeId: 'YOUR_FGA_STORE_ID',
  authorizationModelId: 'YOUR_FGA_AUTHORIZATION_MODEL_ID',
  clientId: 'YOUR_FGA_CLIENT_ID',
  clientSecret: 'REDACTED_FGA_CLIENT_SECRET'
};

// OpenFGA Configuration for Auth0 FGA (Authenticated Mode)
const AUTH_OPENFGA_CONFIG = {
  apiUrl: 'https://api.us1.fga.dev',
  storeId: 'YOUR_FGA_STORE_ID',
  authorizationModelId: 'YOUR_FGA_AUTHORIZATION_MODEL_ID',
  clientId: 'YOUR_FGA_CLIENT_ID',
  clientSecret: 'REDACTED_FGA_CLIENT_SECRET'
};

// Initialize the OpenFGA client (Demo Mode)
const fgaClient = new OpenFgaClient({
  apiUrl: OPENFGA_CONFIG.apiUrl,
  storeId: OPENFGA_CONFIG.storeId,
  authorizationModelId: OPENFGA_CONFIG.authorizationModelId,
  credentials: {
    method: CredentialsMethod.ClientCredentials,
    config: {
      apiTokenIssuer: 'auth.fga.dev',
      apiAudience: 'https://api.us1.fga.dev/',
      clientId: OPENFGA_CONFIG.clientId,
      clientSecret: OPENFGA_CONFIG.clientSecret,
    },
  }
});

// Initialize the OpenFGA client (Authenticated Mode)
const authFgaClient = new OpenFgaClient({
  apiUrl: AUTH_OPENFGA_CONFIG.apiUrl,
  storeId: AUTH_OPENFGA_CONFIG.storeId,
  authorizationModelId: AUTH_OPENFGA_CONFIG.authorizationModelId,
  credentials: {
    method: CredentialsMethod.ClientCredentials,
    config: {
      apiTokenIssuer: 'auth.fga.dev',
      apiAudience: 'https://api.us1.fga.dev/',
      clientId: AUTH_OPENFGA_CONFIG.clientId,
      clientSecret: AUTH_OPENFGA_CONFIG.clientSecret,
    },
  }
});

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize storage service
const storageService = new FileStorageService();

// Helper function to create authorization tuples for a new expense
async function createExpenseTuples(expense) {
  if (!openfgaService.isInitialized) {
    console.log('⏭️ OpenFGA not initialized, skipping tuple creation');
    return;
  }

  try {
    const tuples = [];
    
    // Set owner relationship
    tuples.push({
      user: `user:${expense.submittedBy}`,
      relation: 'owner',
      object: `expense:${expense.id}`
    });
    
    // Set department relationship
    tuples.push({
      user: `department:${expense.department}`,
      relation: 'department',
      object: `expense:${expense.id}`
    });
    
    // Check for existing tuples before writing to prevent duplicates
    const existingTuples = [];
    for (const tuple of tuples) {
      try {
        const exists = await fgaClient.check({
          user: tuple.user,
          relation: tuple.relation,
          object: tuple.object
        });
        
        if (exists.allowed) {
          console.log(`ℹ️ Tuple already exists: ${tuple.user} ${tuple.relation} ${tuple.object}`);
        } else {
          existingTuples.push(tuple);
        }
      } catch (checkError) {
        // If check fails, assume tuple doesn't exist and add it
        existingTuples.push(tuple);
      }
    }
    
    // Only write tuples that don't already exist
    if (existingTuples.length > 0) {
      await fgaClient.write({
        writes: existingTuples.map(tuple => ({
          user: tuple.user,
          relation: tuple.relation,
          object: tuple.object
        }))
      });
      
      console.log(`✅ Created ${existingTuples.length} new authorization tuples for expense ${expense.id}`);
    } else {
      console.log(`ℹ️ All tuples already exist for expense ${expense.id}, skipping creation`);
    }
    
  } catch (error) {
    console.error(`❌ Error creating tuples for expense ${expense.id}:`, error);
    throw error;
  }
}

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

app.post('/api/expenses', async (req, res) => {
  try {
    const expense = req.body;
    const success = storageService.addExpense(expense);
    if (success) {
      // Create authorization tuples for the new expense
      try {
        await createExpenseTuples(expense);
        console.log(`✅ Created authorization tuples for expense ${expense.id}`);
      } catch (tupleError) {
        console.warn(`⚠️ Failed to create authorization tuples for expense ${expense.id}:`, tupleError.message);
        // Don't fail the expense creation if tuple creation fails
      }
      
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

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = storageService.deleteExpense(id);
    if (success) {
      // Remove authorization tuples for the deleted expense
      try {
        await openfgaService.removeAllExpenseTuples(id);
        console.log(`✅ Removed authorization tuples for expense ${id}`);
      } catch (tupleError) {
        console.warn(`⚠️ Failed to remove authorization tuples for expense ${id}:`, tupleError.message);
        // Don't fail the expense deletion if tuple removal fails
      }
      
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

// Authorization API Routes
app.post('/api/auth/check', async (req, res) => {
  try {
    const { user, relation, object } = req.body;
    const allowed = await openfgaService.check(user, relation, object);
    res.json({ allowed });
  } catch (error) {
    console.error('Error checking authorization:', error);
    res.status(500).json({ error: 'Failed to check authorization' });
  }
});

app.post('/api/auth/list-objects', async (req, res) => {
  try {
    const { user, relation, type } = req.body;
    const objects = await openfgaService.listObjects(user, relation, type);
    res.json({ objects });
  } catch (error) {
    console.error('Error listing objects:', error);
    res.status(500).json({ error: 'Failed to list objects' });
  }
});

app.post('/api/auth/add-relationship', async (req, res) => {
  try {
    const { user, relation, object } = req.body;
    await openfgaService.addRelationship(user, relation, object);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding relationship:', error);
    res.status(500).json({ error: 'Failed to add relationship' });
  }
});

app.post('/api/auth/remove-relationship', async (req, res) => {
  try {
    const { user, relation, object } = req.body;
    const success = await openfgaService.removeRelationship(user, relation, object);
    res.json({ success });
  } catch (error) {
    console.error('Error removing relationship:', error);
    res.status(500).json({ error: 'Failed to remove relationship' });
  }
});

app.post('/api/auth/remove-expense-tuples', async (req, res) => {
  try {
    const { expenseId } = req.body;
    const success = await openfgaService.removeAllExpenseTuples(expenseId);
    res.json({ success });
  } catch (error) {
    console.error('Error removing expense tuples:', error);
    res.status(500).json({ error: 'Failed to remove expense tuples' });
  }
});

app.get('/api/auth/status', (req, res) => {
  try {
    const status = openfgaService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting auth status:', error);
    res.status(500).json({ error: 'Failed to get auth status' });
  }
});

// Authenticated Mode API Routes
app.get('/api/auth/expenses', (req, res) => {
  try {
    const expenses = authStorageService.getAllExpenses();
    res.json({ expenses });
  } catch (error) {
    console.error('Error fetching authenticated expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.post('/api/auth/expenses', async (req, res) => {
  try {
    const expense = req.body;
    const success = authStorageService.addExpense(expense);
    if (success) {
      // Create authorization tuples for the new expense
      try {
        await createAuthExpenseTuples(expense);
        console.log(`✅ Created authorization tuples for authenticated expense ${expense.id}`);
      } catch (tupleError) {
        console.warn(`⚠️ Failed to create authorization tuples for authenticated expense ${expense.id}:`, tupleError.message);
        // Don't fail the expense creation if tuple creation fails
      }
      
      res.json({ message: 'Expense added successfully', expense });
    } else {
      res.status(500).json({ error: 'Failed to add expense' });
    }
  } catch (error) {
    console.error('Error adding authenticated expense:', error);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

app.put('/api/auth/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const success = authStorageService.updateExpense(id, updates);
    if (success) {
      res.json({ message: 'Expense updated successfully' });
    } else {
      res.status(404).json({ error: 'Expense not found' });
    }
  } catch (error) {
    console.error('Error updating authenticated expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

app.delete('/api/auth/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = authStorageService.deleteExpense(id);
    if (success) {
      // Remove authorization tuples for the deleted expense
      try {
        await authOpenfgaService.removeAllExpenseTuples(id);
        console.log(`✅ Removed authorization tuples for authenticated expense ${id}`);
      } catch (tupleError) {
        console.warn(`⚠️ Failed to remove authorization tuples for authenticated expense ${id}:`, tupleError.message);
        // Don't fail the expense deletion if tuple removal fails
      }
      
      res.json({ message: 'Expense deleted successfully' });
    } else {
      res.status(404).json({ error: 'Expense not found' });
    }
  } catch (error) {
    console.error('Error deleting authenticated expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Authenticated Authorization API Routes
app.post('/api/auth/auth/check', async (req, res) => {
  try {
    const { user, relation, object } = req.body;
    // Add user: prefix for FGA format
    const fgaUser = user.startsWith('user:') ? user : `user:${user}`;
    const allowed = await authOpenfgaService.check(fgaUser, relation, object);
    res.json({ allowed });
  } catch (error) {
    console.error('Error checking authenticated authorization:', error);
    res.status(500).json({ error: 'Failed to check authorization' });
  }
});

app.post('/api/auth/auth/list-objects', async (req, res) => {
  try {
    const { user, relation, type } = req.body;
    const objects = await authOpenfgaService.listObjects(user, relation, type);
    res.json({ objects });
  } catch (error) {
    console.error('Error listing authenticated objects:', error);
    res.status(500).json({ error: 'Failed to list objects' });
  }
});

app.post('/api/auth/auth/add-relationship', async (req, res) => {
  try {
    const { user, relation, object } = req.body;
    await authOpenfgaService.addRelationship(user, relation, object);
    res.json({ message: 'Relationship added successfully' });
  } catch (error) {
    console.error('Error adding authenticated relationship:', error);
    res.status(500).json({ error: 'Failed to add relationship' });
  }
});

app.post('/api/auth/auth/remove-relationship', async (req, res) => {
  try {
    const { user, relation, object } = req.body;
    const success = await authOpenfgaService.removeRelationship(user, relation, object);
    if (success) {
      res.json({ message: 'Relationship removed successfully' });
    } else {
      res.status(500).json({ error: 'Failed to remove relationship' });
    }
  } catch (error) {
    console.error('Error removing authenticated relationship:', error);
    res.status(500).json({ error: 'Failed to remove relationship' });
  }
});

app.post('/api/auth/auth/remove-expense-tuples', async (req, res) => {
  try {
    const { expenseId } = req.body;
    const success = await authOpenfgaService.removeAllExpenseTuples(expenseId);
    if (success) {
      res.json({ message: 'Expense tuples removed successfully' });
    } else {
      res.status(500).json({ error: 'Failed to remove expense tuples' });
    }
  } catch (error) {
    console.error('Error removing authenticated expense tuples:', error);
    res.status(500).json({ error: 'Failed to remove expense tuples' });
  }
});

app.get('/api/auth/auth/status', (req, res) => {
  try {
    const status = authOpenfgaService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting authenticated auth status:', error);
    res.status(500).json({ error: 'Failed to get auth status' });
  }
});

// Helper function to create authorization tuples for authenticated expenses
async function createAuthExpenseTuples(expense) {
  if (!authOpenfgaService.isInitialized) {
    console.log('⏭️ Auth OpenFGA not initialized, skipping tuple creation');
    return;
  }

  try {
    const tuples = [];
    
    // Set owner relationship
    tuples.push({
      user: `user:${expense.submittedBy}`,
      relation: 'owner',
      object: `expense:${expense.id}`
    });
    
    // Set department relationship
    tuples.push({
      user: `department:${expense.department}`,
      relation: 'department',
      object: `expense:${expense.id}`
    });
    
    // Check for existing tuples before writing to prevent duplicates
    const existingTuples = [];
    for (const tuple of tuples) {
      try {
        const exists = await authFgaClient.check({
          user: tuple.user,
          relation: tuple.relation,
          object: tuple.object
        });
        
        if (exists.allowed) {
          console.log(`ℹ️ Auth tuple already exists: ${tuple.user} ${tuple.relation} ${tuple.object}`);
        } else {
          existingTuples.push(tuple);
        }
      } catch (checkError) {
        // If check fails, assume tuple doesn't exist and add it
        existingTuples.push(tuple);
      }
    }
    
    // Only write tuples that don't already exist
    if (existingTuples.length > 0) {
      await authFgaClient.write({
        writes: existingTuples.map(tuple => ({
          user: tuple.user,
          relation: tuple.relation,
          object: tuple.object
        }))
      });
      
      console.log(`✅ Created ${existingTuples.length} new authorization tuples for authenticated expense ${expense.id}`);
    } else {
      console.log(`ℹ️ All tuples already exist for authenticated expense ${expense.id}, skipping creation`);
    }
    
  } catch (error) {
    console.error(`❌ Error creating tuples for authenticated expense ${expense.id}:`, error);
    throw error;
  }
}

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