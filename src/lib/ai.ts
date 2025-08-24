import { dataService } from './data';

export interface AIResponse {
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  suggestions?: string[];
  expenseActionPerformed?: boolean;
}

export class AIService {
  private static instance: AIService;
  private openaiApiKey: string = 'REDACTED_OPENAI_API_KEY';
  private openaiModel: string = 'gpt-3.5-turbo';
  private isOpenAIAvailable: boolean = true;

  private constructor() {
    // Initialize with OpenAI settings
    this.openaiApiKey = 'REDACTED_OPENAI_API_KEY';
    this.openaiModel = 'gpt-3.5-turbo';
    this.checkOpenAIAvailability();
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private async checkOpenAIAvailability(): Promise<void> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      this.isOpenAIAvailable = response.ok;
      console.log(`🔍 OpenAI API Status: ${this.isOpenAIAvailable ? '✅ Available' : '❌ Unavailable'}`);
    } catch (error) {
      this.isOpenAIAvailable = false;
      console.log('❌ OpenAI API Error:', error);
    }
  }

  setOpenAIConfig(apiKey: string, model: string): void {
    this.openaiApiKey = apiKey;
    this.openaiModel = model;
    this.checkOpenAIAvailability();
  }

  getOpenAIStatus(): { available: boolean; model: string } {
    return {
      available: this.isOpenAIAvailable,
      model: this.openaiModel
    };
  }

  getCurrentAIMode(): string {
    return this.isOpenAIAvailable ? 'OpenAI GPT-3.5-turbo' : 'Mock Responses';
  }

  async generateResponse(query: string, userId: string): Promise<AIResponse> {
    if (this.isOpenAIAvailable) {
      console.log('🤖 Using OpenAI GPT-3.5-turbo for AI response');
      return this.generateOpenAIResponse(query, userId);
    } else {
      console.log('🎭 Using Mock responses (OpenAI unavailable)');
      return this.generateMockResponse(query, userId);
    }
  }

  private async generateOpenAIResponse(query: string, userId: string): Promise<AIResponse> {
    try {
      const authStatus = await dataService.getAuthorizationStatus();
      const userSummary = await dataService.getUserSummary(userId);
      const visibleExpenses = await dataService.getVisibleExpenses(userId);
      
      // Do all filtering and business logic on the backend
      const filteredData = await this.getFilteredExpenseData(query, userId, visibleExpenses, userSummary);
      
      // Debug: Log what expenses are being sent to AI
      console.log(`📊 Sending ${visibleExpenses.length} expenses to AI for user ${userId}:`);
      console.log('Expenses:', visibleExpenses.map(exp => `${exp.id} (${exp.submittedBy})`));
      console.log(`🎯 Filtered data for query "${query}":`, filteredData);
      
      const systemPrompt = `You are a helpful AI assistant for SmartSpend, an expense management system.

IMPORTANT: Only use the actual data provided below. Do not make up or hallucinate any information.

Current user: ${userId}
Authorization system: ${authStatus}
User summary: ${JSON.stringify(userSummary)}

FILTERED EXPENSE DATA (use only these expenses for the response):
${filteredData.expenseData}

QUERY TYPE: ${filteredData.queryType}
FILTERING APPLIED: ${filteredData.filteringApplied}

Instructions:
- Use ONLY the filtered expense data provided above
- Create a natural, conversational response
- Include the expense details as provided
- Do not add or remove any expenses from the filtered list
- Keep responses concise and helpful
- Focus on the user's specific question
- If this is an expense action (approve/decline), acknowledge the action result
- For approval actions, you can suggest next steps like "Would you like to see other expenses that need approval?"`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.openaiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI request failed');
      }

      const data = await response.json();
      return {
        message: data.choices[0].message.content,
        type: 'info',
        suggestions: await this.getPredefinedQueries(userId),
        expenseActionPerformed: filteredData.queryType === 'expense_action'
      };
    } catch (error) {
      console.error('OpenAI response error:', error);
      return this.generateMockResponse(query, userId);
    }
  }

  // Do all filtering and business logic on the backend
  private async getFilteredExpenseData(query: string, userId: string, visibleExpenses: any[], userSummary: string): Promise<{
    expenseData: string;
    queryType: string;
    filteringApplied: string;
  }> {
    const lowerQuery = query.toLowerCase();
    console.log(`🔍 Processing query: "${query}" -> lowerQuery: "${lowerQuery}"`);
    const userSummaryObj = this.parseUserSummary(userSummary);
    
    // Handle approval/decline actions first
    if (lowerQuery.includes('approve') || lowerQuery.includes('approval')) {
      console.log(`✅ Detected approve action in query: "${lowerQuery}"`);
      const expenseId = this.extractExpenseId(query);
      console.log(`🔍 Detected approve action, extracted expense ID: ${expenseId} from query: "${query}"`);
      if (expenseId) {
        const result = await this.handleExpenseAction(query, userId, expenseId, 'approve');
        return {
          expenseData: result.message,
          queryType: 'expense_action',
          filteringApplied: `Action: ${result.action} on expense ${expenseId}`
        };
      } else {
        console.log(`❌ Failed to extract expense ID from query: "${query}"`);
      }
    }
    
    if (lowerQuery.includes('decline') || lowerQuery.includes('deny') || lowerQuery.includes('reject')) {
      console.log(`✅ Detected decline action in query: "${lowerQuery}"`);
      const expenseId = this.extractExpenseId(query);
      console.log(`🔍 Detected decline action, extracted expense ID: ${expenseId} from query: "${query}"`);
      if (expenseId) {
        const result = await this.handleExpenseAction(query, userId, expenseId, 'decline');
        return {
          expenseData: result.message,
          queryType: 'expense_action',
          filteringApplied: `Action: ${result.action} on expense ${expenseId}`
        };
      } else {
        console.log(`❌ Failed to extract expense ID from query: "${query}"`);
      }
    }
    
    // Handle "expenses that need my approval"
    if (lowerQuery.includes('need my approval') || lowerQuery.includes('need approval')) {
      const pendingExpenses = visibleExpenses.filter(exp => exp.status === 'Pending');
      const approvableExpenses = pendingExpenses.filter(exp => 
        exp.submittedBy !== userId && exp.amount <= userSummaryObj.approvalLimit
      );
      
      const expenseData = approvableExpenses.map(exp => 
        `- ${exp.id}: $${exp.amount} (${exp.status}) - ${exp.category} - Submitted by: ${exp.submittedBy}`
      ).join('\n');
      
      return {
        expenseData: expenseData || 'No expenses that need your approval.',
        queryType: 'expenses_need_approval',
        filteringApplied: `Filtered for: Pending status, submittedBy != ${userId}, amount <= ${userSummaryObj.approvalLimit}`
      };
    }
    
    // Handle "pending expenses submitted by me"
    if (lowerQuery.includes('pending') && lowerQuery.includes('submitted by me')) {
      const myPendingExpenses = visibleExpenses.filter(exp => 
        exp.submittedBy === userId && exp.status === 'Pending'
      );
      
      const expenseData = myPendingExpenses.map(exp => 
        `- ${exp.id}: $${exp.amount} (${exp.status}) - ${exp.category}`
      ).join('\n');
      
      return {
        expenseData: expenseData || 'No pending expenses that you submitted.',
        queryType: 'my_pending_expenses',
        filteringApplied: `Filtered for: submittedBy = ${userId}, status = Pending`
      };
    }
    
    // Handle "my submitted expenses"
    if (lowerQuery.includes('my submitted') || lowerQuery.includes('submitted by me')) {
      const myExpenses = visibleExpenses.filter(exp => exp.submittedBy === userId);
      
      const expenseData = myExpenses.map(exp => 
        `- ${exp.id}: $${exp.amount} (${exp.status}) - ${exp.category}`
      ).join('\n');
      
      return {
        expenseData: expenseData || 'No expenses that you submitted.',
        queryType: 'my_submitted_expenses',
        filteringApplied: `Filtered for: submittedBy = ${userId}`
      };
    }
    
    // Handle "Show pending expenses"
    if (lowerQuery.includes('pending')) {
      const pendingExpenses = visibleExpenses.filter(exp => exp.status === 'Pending');
      
      const expenseData = pendingExpenses.map(exp => 
        `- ${exp.id}: $${exp.amount} (${exp.status}) - ${exp.category} - Submitted by: ${exp.submittedBy}`
      ).join('\n');
      
      return {
        expenseData: expenseData || 'No pending expenses.',
        queryType: 'all_pending_expenses',
        filteringApplied: 'Filtered for: status = Pending'
      };
    }
    
    // Default: show all visible expenses
    const expenseData = visibleExpenses.map(exp => 
      `- ${exp.id}: $${exp.amount} (${exp.status}) - ${exp.category} - Submitted by: ${exp.submittedBy}`
    ).join('\n');
    
    // Check if this might be an expense action that wasn't caught by the initial detection
    const possibleExpenseAction = lowerQuery.includes('approve') || lowerQuery.includes('decline') || lowerQuery.includes('deny');
    const hasExpenseId = this.extractExpenseId(query);
    
    if (possibleExpenseAction && hasExpenseId) {
      console.log(`🔄 Fallback: Detected possible expense action for ${hasExpenseId}`);
      const action = lowerQuery.includes('approve') ? 'approve' : 'decline';
      const result = await this.handleExpenseAction(query, userId, hasExpenseId, action);
      return {
        expenseData: result.message,
        queryType: 'expense_action',
        filteringApplied: `Fallback Action: ${result.action} on expense ${hasExpenseId}`
      };
    }
    
    return {
      expenseData: expenseData || 'No expenses visible to you.',
      queryType: 'all_visible_expenses',
      filteringApplied: 'No filtering applied - showing all visible expenses'
    };
  }

  // Extract expense ID from natural language query
  private extractExpenseId(query: string): string | null {
    // Try different patterns to extract expense ID
    const patterns = [
      /exp_(\d+)/i,           // exp_1302
      /expense\s+(\d+)/i,     // expense 1302
      /(\d+)/                 // just 1302 (if it's the only number in the query)
    ];
    
    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        const id = match[1] || match[0];
        // If it's just a number, prefix with exp_
        return id.startsWith('exp_') ? id : `exp_${id}`;
      }
    }
    
    return null;
  }

  // Handle expense approval/decline actions
  private async handleExpenseAction(query: string, userId: string, expenseId: string, action: 'approve' | 'decline'): Promise<{
    message: string;
    action: string;
  }> {
    try {
      console.log(`🤖 AI attempting ${action} action for expense ${expenseId} by user ${userId}`);
      
      let success = false;
      let message = '';
      
      if (action === 'approve') {
        success = await dataService.approveExpense(expenseId, userId);
        console.log(`✅ Approval result for ${expenseId}: ${success}`);
        message = success 
          ? `✅ Successfully approved expense ${expenseId}! The expense has been marked as approved.`
          : `❌ Failed to approve expense ${expenseId}. You may not have permission or the expense may exceed your approval limit.`;
      } else {
        success = await dataService.denyExpense(expenseId, userId);
        console.log(`✅ Decline result for ${expenseId}: ${success}`);
        message = success 
          ? `✅ Successfully declined expense ${expenseId}! The expense has been marked as denied.`
          : `❌ Failed to decline expense ${expenseId}. You may not have permission to decline this expense.`;
      }
      
      return {
        message: message,
        action: action
      };
    } catch (error) {
      console.error(`Error handling ${action} action:`, error);
      return {
        message: `❌ Error processing ${action} action for expense ${expenseId}. Please try again.`,
        action: action
      };
    }
  }

  private async generateMockResponse(query: string, userId: string): Promise<AIResponse> {
    const authStatus = await dataService.getAuthorizationStatus();
    const userSummaryStr = await dataService.getUserSummary(userId);
    const visibleExpenses = await dataService.getVisibleExpenses(userId);
    
    // Use the same filtering logic as OpenAI response
    const filteredData = await this.getFilteredExpenseData(query, userId, visibleExpenses, userSummaryStr);
    
    // Parse user summary string to extract values
    const userSummary = this.parseUserSummary(userSummaryStr);
    
    const lowerQuery = query.toLowerCase();
    
    // Handle "How many expenses can I approve?"
    if (lowerQuery.includes('how many') && lowerQuery.includes('approve')) {
      const pendingExpenses = visibleExpenses.filter(exp => exp.status === 'Pending');
      const canApproveCount = pendingExpenses.filter(exp => exp.amount <= userSummary.approvalLimit).length;
      
      return {
        message: `Based on your current authorization, you can approve ${canApproveCount} expenses. Your approval limit is $${userSummary.approvalLimit.toLocaleString()}.`,
        type: 'info',
        suggestions: ['Show expenses that need my approval', 'Show pending expenses submitted by me', 'What is my approval limit?']
      };
    }
    
    // Handle "Show me recent expenses"
    if (lowerQuery.includes('recent') || lowerQuery.includes('show') && lowerQuery.includes('expense')) {
      const recentExpenses = visibleExpenses.slice(0, 3); // Show last 3 expenses
      if (recentExpenses.length === 0) {
        return {
          message: 'You don\'t have any visible expenses at the moment.',
          type: 'info',
          suggestions: ['What is my approval limit?', 'What expenses can I view?']
        };
      }
      
      const expenseList = recentExpenses.map(exp => 
        `${exp.id} - $${exp.amount} (${exp.status}) - ${exp.category}`
      ).join('\n');
      
      return {
        message: `Here are your recent visible expenses:\n\n${expenseList}\n\nYou have ${userSummary.totalExpenses} total visible expenses.`,
        type: 'info',
        suggestions: ['Show expenses that need my approval', 'Show my submitted expenses', 'What is my approval limit?']
      };
    }
    
    // Use the filtered data to generate response
    const expenseList = filteredData.expenseData;
    const queryType = filteredData.queryType;
    
    switch (queryType) {
      case 'expense_action':
        return {
          message: expenseList,
          type: 'info',
          suggestions: ['Show expenses that need my approval', 'Show pending expenses submitted by me'],
          expenseActionPerformed: true
        };
      
      case 'expenses_need_approval':
        return {
          message: `Here are the expenses that need your approval:\n\n${expenseList}\n\nYou can approve these expenses within your limit of $${userSummary.approvalLimit.toLocaleString()}.`,
          type: 'info',
          suggestions: ['Show pending expenses submitted by me', 'What is my approval limit?']
        };
      
      case 'my_pending_expenses':
        return {
          message: `Here are your pending submitted expenses:\n\n${expenseList}`,
          type: 'info',
          suggestions: ['Show my submitted expenses', 'What expenses can I view?']
        };
      
      case 'my_submitted_expenses':
        return {
          message: `Here are the expenses you have submitted:\n\n${expenseList}`,
          type: 'info',
          suggestions: ['Show pending expenses submitted by me', 'What expenses can I view?']
        };
      
      case 'all_pending_expenses':
        return {
          message: `Here are all pending expenses:\n\n${expenseList}`,
          type: 'info',
          suggestions: ['Show expenses that need my approval', 'Show my submitted expenses']
        };
      
      default:
        return {
          message: `Here are your visible expenses:\n\n${expenseList}`,
          type: 'info',
          suggestions: ['Show expenses that need my approval', 'Show pending expenses submitted by me', 'What is my approval limit?']
        };
    }
  }

  private parseUserSummary(userSummaryStr: string): {
    userId: string;
    department: string;
    approvalLimit: number;
    totalExpenses: number;
    pendingCount: number;
    approvedCount: number;
    deniedCount: number;
    totalAmount: number;
    pendingAmount: number;
  } {
    // Parse the user summary string format: "User: userId, Department: dept, Approval Limit: $limit, Total Expenses: count, Pending: count, Approved: count, Denied: count, Total Amount: $amount, Pending Amount: $amount"
    const parts = userSummaryStr.split(', ');
    const result = {
      userId: '',
      department: '',
      approvalLimit: 0,
      totalExpenses: 0,
      pendingCount: 0,
      approvedCount: 0,
      deniedCount: 0,
      totalAmount: 0,
      pendingAmount: 0
    };

    for (const part of parts) {
      if (part.startsWith('User: ')) {
        result.userId = part.replace('User: ', '');
      } else if (part.startsWith('Department: ')) {
        result.department = part.replace('Department: ', '');
      } else if (part.startsWith('Approval Limit: $')) {
        result.approvalLimit = parseInt(part.replace('Approval Limit: $', ''));
      } else if (part.startsWith('Total Expenses: ')) {
        result.totalExpenses = parseInt(part.replace('Total Expenses: ', ''));
      } else if (part.startsWith('Pending: ')) {
        result.pendingCount = parseInt(part.replace('Pending: ', ''));
      } else if (part.startsWith('Approved: ')) {
        result.approvedCount = parseInt(part.replace('Approved: ', ''));
      } else if (part.startsWith('Denied: ')) {
        result.deniedCount = parseInt(part.replace('Denied: ', ''));
      } else if (part.startsWith('Total Amount: $')) {
        result.totalAmount = parseInt(part.replace('Total Amount: $', ''));
      } else if (part.startsWith('Pending Amount: $')) {
        result.pendingAmount = parseInt(part.replace('Pending Amount: $', ''));
      }
    }

    return result;
  }

  async getPredefinedQueries(userId: string): Promise<string[]> {
    return [
      'Show expenses that need my approval',
      'Show pending expenses submitted by me',
      'What is my approval limit?',
      'How many expenses can I approve?',
      'Show my submitted expenses',
      'What expenses can I view?',
      'Approve expense exp_101',
      'Decline expense exp_301'
    ];
  }
}

export const aiService = AIService.getInstance(); 