# OpenFGA Playground Setup Guide

This guide will help you set up OpenFGA Playground to use with the SmartSpend AI Finance Assistant.

## 🚀 Quick Start

### 1. Create OpenFGA Playground Account

1. Go to [playground.fga.dev](https://playground.fga.dev)
2. Sign up for a free account
3. Create a new store for SmartSpend

### 2. Get Your Credentials

1. **Store ID**: Copy your store ID from the playground dashboard
2. **API Token**: Generate an API token in your store settings

### 3. Configure SmartSpend

1. Start the SmartSpend application: `npm run dev`
2. Go to the **AI Assistant** tab
3. Click the settings icon (⚙️)
4. Enter your OpenFGA credentials:
   - **Store ID**: Your playground store ID
   - **API Token**: Your playground API token
5. Click "Save Configuration"

## 📋 Detailed Setup

### Step 1: OpenFGA Playground Account

1. Visit [playground.fga.dev](https://playground.fga.dev)
2. Click "Sign Up" and create your account
3. Verify your email address

### Step 2: Create a Store

1. After logging in, click "Create Store"
2. Name your store: `SmartSpend Store`
3. Note down the **Store ID** (you'll need this later)

### Step 3: Generate API Token

1. Go to your store dashboard
2. Navigate to "Settings" → "API Tokens"
3. Click "Generate New Token"
4. Give it a name like "SmartSpend Integration"
5. Copy the **API Token** (keep it secure!)

### Step 4: Configure SmartSpend

The application will automatically:
- Create the authorization model
- Set up user relationships
- Configure expense and budget permissions

## 🔐 Authorization Model

The SmartSpend application uses this OpenFGA authorization model:

### User Types
- **user**: Individual users in the system
- **expense**: Expense reports with relationships
- **budget**: Department budgets
- **role**: User roles and permissions

### Key Relationships

#### Expense Permissions
- `owner`: Who submitted the expense
- `manager`: Who manages the submitter
- `department`: Which department the expense belongs to
- `can_view`: Who can see the expense
- `can_approve`: Who can approve the expense

#### Budget Permissions
- `department`: Which department the budget belongs to
- `can_view`: Who can see the budget information

#### Role Permissions
- `department_member`: Users in a department
- `can_approve_up_to_500`: Managers who can approve up to $500
- `can_approve_up_to_5000`: VPs who can approve up to $5,000
- `finance_auditor`: Finance team with audit access

## 👥 User Roles Setup

The application automatically creates these relationships:

### Engineering Team
- **Dina Dev**: Can only view own expenses
- **Raj Manager**: Can approve expenses up to $500 for team
- **Chen VP**: Can approve expenses up to $5,000 for department

### Finance Team
- **Frank Finance**: Can view all expenses for auditing (no approval)

### Department Budgets
- Engineering, Marketing, Sales, Finance budgets
- Role-based visibility and access

## 🔧 Configuration Options

### In-App Configuration
1. Go to AI Assistant tab
2. Click settings icon (⚙️)
3. Enter your OpenFGA credentials
4. Save configuration

### Environment Variables (Optional)
You can also set credentials via environment variables:
```bash
VITE_OPENFGA_STORE_ID=your-store-id
VITE_OPENFGA_API_TOKEN=your-api-token
```

## 🧪 Testing the Setup

### 1. Check Authorization System
- Look for the "OpenFGA" badge in the UI
- Switch between user roles to see different permissions

### 2. Test Expense Approvals
- Try approving expenses with different user roles
- Verify approval limits are enforced

### 3. Test Budget Visibility
- Check that users only see their department budgets
- Finance users should see all budgets

### 4. Test AI Integration
- Ask the AI about expenses and approvals
- Verify it understands your role and permissions

## 🔍 Troubleshooting

### OpenFGA Not Connecting
1. **Check credentials**: Verify Store ID and API Token
2. **Check network**: Ensure you can access playground.fga.dev
3. **Check store**: Verify your store exists and is active

### Authorization Not Working
1. **Check model**: Verify the authorization model was created
2. **Check relationships**: Ensure user relationships were set up
3. **Check permissions**: Verify the specific permission you're testing

### Fallback to Custom FGA
If OpenFGA fails, the system automatically falls back to the custom FGA system. You'll see "Custom FGA" in the UI instead of "OpenFGA".

## 📊 Monitoring

### OpenFGA Playground Dashboard
- Monitor API usage in your playground dashboard
- Check relationship counts and model status
- View audit logs for authorization decisions

### Application Logs
- Check browser console for OpenFGA connection status
- Look for authorization decision logs
- Monitor fallback to custom FGA

## 🔒 Security Best Practices

1. **Secure API Token**: Never commit your API token to version control
2. **Regular Rotation**: Rotate your API token periodically
3. **Least Privilege**: Use the minimum permissions necessary
4. **Monitor Usage**: Regularly check your playground dashboard

## 🆘 Support

### OpenFGA Playground Issues
- Check the [OpenFGA documentation](https://docs.fga.dev/)
- Visit the [OpenFGA community](https://discord.gg/8naAwJfWN6)
- Contact OpenFGA support through the playground

### SmartSpend Integration Issues
- Check the browser console for error messages
- Verify your credentials are correct
- Ensure the authorization model was created successfully

## 🎯 Next Steps

Once OpenFGA is configured:

1. **Explore the Playground**: Use the OpenFGA playground to explore your authorization model
2. **Test Different Scenarios**: Try various user roles and permissions
3. **Customize Permissions**: Modify the authorization model for your specific needs
4. **Scale Up**: Consider using OpenFGA Cloud for production deployments

## 📚 Additional Resources

- [OpenFGA Documentation](https://docs.fga.dev/)
- [OpenFGA Playground](https://playground.fga.dev)
- [OpenFGA Community](https://discord.gg/8naAwJfWN6)
- [Fine-Grained Authorization Concepts](https://docs.fga.dev/concepts) 