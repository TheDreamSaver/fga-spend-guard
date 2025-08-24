# Configuration Guide

## OpenAI AI Setup (Optional)

The SmartSpend AI Assistant can use real AI responses via OpenAI API, or fall back to intelligent mock responses.

### Option 1: OpenAI API (Recommended)

1. **Get OpenAI API Key** from [platform.openai.com](https://platform.openai.com/api-keys)
2. **Configure the API Key** in the application
3. **Start the application** - it will automatically use OpenAI

### Option 2: In-App Configuration

1. Start the application
2. Go to the "AI Assistant" tab
3. The system will automatically use OpenAI with the configured API key

### Option 3: Mock Mode (Fallback)

If OpenAI is not available, the system will use intelligent mock responses that are:
- Role-aware and context-sensitive
- Based on real application data
- Provide helpful suggestions
- Explain authorization restrictions

## OpenAI Models

The system is configured to use **GPT-3.5-turbo** by default, but you can use any OpenAI model:

### Recommended Models
- **gpt-3.5-turbo** - Fast, good quality responses (default)
- **gpt-4** - Higher quality responses (requires GPT-4 access)
- **gpt-3.5-turbo-16k** - Longer context window

### API Key Configuration

The application is pre-configured with an OpenAI API key. If you need to use your own:

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Update the `openaiApiKey` in `src/lib/ai.ts`
3. Restart the application

## OpenAI Configuration

### Default Settings
- **Model**: `gpt-3.5-turbo`
- **API Key**: Pre-configured
- **Max Tokens**: 500
- **Temperature**: 0.7

### Custom Configuration
You can modify the OpenAI settings in `src/lib/ai.ts`:

```typescript
private openaiModel: string = 'gpt-4'; // Change model
private openaiApiKey: string = 'your-api-key-here'; // Change API key
```

## Testing Different Modes

1. **Mock Mode**: Run without valid OpenAI API key
2. **Real AI Mode**: Use OpenAI API with valid key
3. **Custom Model Mode**: Use different OpenAI models
4. **Fallback Mode**: Automatic fallback to mock responses

## Troubleshooting

### OpenAI Not Working
- Ensure you have a valid OpenAI API key
- Check if the API key has sufficient credits
- Verify the model name is correct
- Check network connectivity

### API Key Issues
- Ensure the API key is valid and active
- Check if you have sufficient OpenAI credits
- Verify the API key has the correct permissions

### Connection Issues
- Check internet connectivity
- Verify OpenAI API is accessible
- Check firewall settings

## Performance Tips

- **Use GPT-3.5-turbo** for faster responses
- **Use GPT-4** for higher quality responses
- **Adjust max_tokens** for longer/shorter responses
- **Use mock mode** for development/testing 