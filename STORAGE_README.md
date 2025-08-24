# JSON File Storage System

This project now uses a JSON file-based storage system instead of browser localStorage for persistent data storage.

## 📁 Files

- **`storage.json`** - The main data file containing all expenses
- **`storage-service.js`** - Node.js service for reading/writing to the JSON file
- **`server.js`** - Express API server that provides REST endpoints
- **`src/lib/storage.ts`** - Frontend service that communicates with the API

## 🚀 Setup

### 1. Start the Storage Server
```bash
npm run server
```
This starts the Express server on `http://localhost:3001`

### 2. Start the Frontend
```bash
npm run dev
```
This starts the Vite dev server on `http://localhost:5173`

## 📊 API Endpoints

The storage server provides these REST endpoints:

- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Add a new expense
- `PUT /api/expenses/:id` - Update an expense
- `POST /api/expenses/reset` - Reset to default expenses
- `GET /api/health` - Health check

## 🛠️ CLI Commands

You can also use the storage service directly:

```bash
# List all expenses
node storage-service.js list

# Reset to default expenses
node storage-service.js reset

# Add a new expense
node storage-service.js add '{"id":"exp_103","description":"Test","amount":100,"date":"2024-01-30","status":"Pending","submittedBy":"dina_dev","department":"Engineering","category":"Test"}'
```

## 🔄 How It Works

1. **Frontend** makes API calls to `http://localhost:3001/api/*`
2. **Express server** handles the requests and calls the storage service
3. **Storage service** reads/writes to `storage.json`
4. **Data persists** across server restarts and page refreshes

## 📝 Data Format

The `storage.json` file contains:
```json
{
  "expenses": [
    {
      "id": "exp_101",
      "description": "Laptop accessories",
      "amount": 150,
      "date": "2024-01-15",
      "status": "Pending",
      "submittedBy": "dina_dev",
      "department": "Engineering",
      "category": "Equipment"
    }
  ]
}
```

## 🔧 Fallback Behavior

If the API server is not running, the frontend will:
1. Show a warning in the console
2. Fall back to default expenses
3. Continue to work (but without persistence)

## 🎯 Benefits

- **Persistent storage** - Data survives page refreshes and server restarts
- **Easy to inspect** - JSON file is human-readable
- **Version control friendly** - Can be committed to git
- **Simple backup** - Just copy the JSON file
- **No database setup** - Perfect for demos and prototypes 