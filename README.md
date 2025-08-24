# SmartSpend - Intelligent Expense Management

A modern expense management application with Fine-Grained Authorization (FGA) and AI-powered assistance, built with React, TypeScript, and OpenFGA.

## 🚀 Features

- **Fine-Grained Authorization**: Role-based access control with OpenFGA
- **AI Assistant**: Cloud-based AI processing with OpenAI API
- **Multi-Role User System**: Different permission levels for different user types
- **Real-time Authorization**: Dynamic permission checking
- **Modern UI**: Built with shadcn/ui and Tailwind CSS

## 🏗️ Architecture

### Core Services

- **OpenFGA Service**: Handles all authorization logic
- **Data Service**: Centralized data management with authorization awareness
- **AI Service**: Local AI processing with Ollama integration
- **FGA Service**: Legacy authorization system (deprecated)

### User Roles

- **Dina Dev** (Software Engineer): Can view own expenses
- **Raj Manager** (Engineering Manager): Can approve up to $500
- **Chen VP** (VP of Engineering): Can approve up to $5,000
- **Frank Finance** (Financial Analyst): Can view all expenses for auditing

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Lucide React
- **Authorization**: OpenFGA (Fine-Grained Authorization)
- **AI**: OpenAI API (cloud processing)
- **State Management**: React Hooks + Singleton Services

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fga-spend-guard-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
npm run dev
```

## 🔧 Configuration

### OpenFGA Setup

The application uses OpenFGA Playground for authorization. Setup is handled by a single script:

```bash
# Complete setup (model + tuples + tests)
node openfga-setup.js

# Only create the authorization model
node openfga-setup.js --model-only

# Only write initial relationships
node openfga-setup.js --tuples-only

# Only test existing relationships
node openfga-setup.js --test-only
```

### OpenAI AI Setup

For cloud-based AI processing:

1. **Get OpenAI API Key**
   - Visit [platform.openai.com](https://platform.openai.com/api-keys)
   - Create an account and generate an API key
   - The application is pre-configured with an API key

2. **Configure in the app**
   - The AI Assistant automatically uses OpenAI
   - No additional configuration required
   - Falls back to intelligent mock responses if API is unavailable

## 🎯 Usage

1. **Select a User Persona**: Use the persona selector to switch between different user roles
2. **View Expenses**: See expenses based on your authorization level
3. **Approve/Deny**: Take action on expenses within your approval limit
4. **AI Assistant**: Ask questions about expenses and authorization

## 🔐 Authorization Model

The application uses a simplified OpenFGA model with three main types:

- **user**: Basic user type
- **department**: Department with member and approval relations
- **expense**: Expense with owner, manager, department, and permission relations

### Key Relationships

- Users are members of departments
- Users have approval limits within departments
- Expenses have owners, managers, and department associations
- View and approval permissions are computed based on relationships

## 🧪 Testing

The setup script includes comprehensive tests to verify:

- Owner can view own expenses
- Manager can view and approve managed expenses
- Department members can view department expenses
- Department approvers can approve within limits
- Finance auditors can only view finance expenses

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── AIAssistant.tsx  # AI chat interface
│   ├── ExpenseReports.tsx # Expense management
│   └── ui/             # shadcn/ui components
├── lib/
│   ├── openfga.ts      # OpenFGA service
│   ├── data.ts         # Data management
│   ├── ai.ts           # AI service
│   └── fga.ts          # Legacy FGA (deprecated)
├── pages/
│   └── Index.tsx       # Main application page
└── main.tsx            # Application entry point
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the OpenFGA setup
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues related to:
- **OpenFGA**: Check the setup script output
- **Ollama**: Ensure the service is running and model is available
- **Authorization**: Verify the relationships in OpenFGA Playground
