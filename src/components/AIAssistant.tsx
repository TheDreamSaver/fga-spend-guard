import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, Sparkles, AlertTriangle, CheckCircle, XCircle, Settings, Server } from 'lucide-react';
import { toast } from "sonner";
import { aiService, AIResponse } from '@/lib/ai';
import { dataService } from '@/lib/data';
import { USERS } from '@/lib/fga';

type MessageType = 'info' | 'success' | 'warning' | 'error';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  type?: MessageType;
  suggestions?: string[];
}

interface AIAssistantProps {
  currentUser: string;
  persona: any;
  onExpenseAction?: () => void; // Callback to refresh expense reports
}

const AIAssistant = ({ currentUser, persona, onExpenseAction }: AIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [authSystem, setAuthSystem] = useState<'OpenFGA' | 'Not Available'>('Not Available');
  const [predefinedQueries, setPredefinedQueries] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: Message = {
      id: '1',
      sender: 'ai',
      content: `Hello ${persona.name}! I'm your SmartSpend AI Finance Assistant. I can help you with expense reports and approval workflows based on your role as ${persona.role}. What would you like to know?`,
      timestamp: new Date(),
      type: 'info'
    };
    setMessages([welcomeMessage]);

    // Load predefined queries and update auth system
    loadPredefinedQueries();
    updateAuthSystem();
  }, [persona]);

  const loadPredefinedQueries = async () => {
    try {
      const queries = await aiService.getPredefinedQueries(currentUser);
      setPredefinedQueries(queries);
    } catch (error) {
      console.error('Error loading predefined queries:', error);
    }
  };

  const updateAuthSystem = async () => {
    const authStatus = await dataService.getAuthorizationStatus();
    setAuthSystem(authStatus === 'Configured' ? 'OpenFGA' : 'Not Available');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (query?: string) => {
    const messageText = query || inputValue.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await aiService.generateResponse(messageText, currentUser);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: response.message,
        timestamp: new Date(),
        type: response.type,
        suggestions: response.suggestions
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Check if this was an expense action (approve/decline) and trigger refresh
      const lowerQuery = messageText.toLowerCase();
      const isExpenseAction = (lowerQuery.includes('approve') || lowerQuery.includes('decline') || lowerQuery.includes('deny')) && 
                             lowerQuery.includes('exp_');
      
      // Also check if the AI response indicates a successful action
      const responseIndicatesAction = response.message.includes('Successfully approved') || 
                                    response.message.includes('Successfully declined') ||
                                    response.message.includes('Successfully denied');
      
      // Use the new expenseActionPerformed property from the AI response
      if (isExpenseAction || responseIndicatesAction || response.expenseActionPerformed) {
        console.log('🔄 Expense action detected, triggering refresh...');
        // Wait a moment for the backend to update, then refresh
        setTimeout(() => {
          onExpenseAction?.();
        }, 500);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      toast.error('Failed to generate response');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
        type: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-600" />;
    }
  };

  const getMessageBorder = (type?: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border border-green-200';
      case 'warning':
        return 'bg-yellow-50 border border-yellow-200';
      case 'error':
        return 'bg-red-50 border border-red-200';
      default:
        return 'bg-gray-50 border border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Chat Interface */}
      <Card className="bg-white/70 backdrop-blur border-0 shadow-lg">
        <CardContent className="p-0">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'ai' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : ''}`}>
                  <div
                    className={`p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : `${getMessageBorder(message.type)}`
                    }`}
                  >
                    {message.sender === 'ai' && message.type && (
                      <div className="flex items-center gap-2 mb-2">
                        {getMessageIcon(message.type)}
                        <span className="text-xs font-medium uppercase tracking-wide">
                          {message.type === 'info' ? 'Information' : message.type}
                        </span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  </div>
                  
                  {/* Suggestions */}
                  {message.sender === 'ai' && message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs h-6 px-2"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-1 px-3">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                {message.sender === 'user' && (
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about expenses, budgets, or approvals..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white/70 backdrop-blur border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Try these questions:</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {predefinedQueries.map((query, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSendMessage(query)}
                className="justify-start text-left h-auto p-3 whitespace-normal"
              >
                {query}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAssistant;
