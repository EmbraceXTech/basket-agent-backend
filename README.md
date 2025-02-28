# Basket Agent Backend

<div align="center">
<img src="./public/basket-agent-logo.png" width="200" />
</div>

Basket Agent Backend API is the server-side component of the Basket Agent Telegram MiniApp. It handles all the trading logic, wallet management, and integration with various services to enable secure and efficient token trading.

## Features

- RESTful API Endpoints: Comprehensive set of endpoints for trading operations, wallet management, and user authentication
- Para Integration: Secure wallet management and user onboarding through Para's embedded wallet system
- Trading Engine: Backend logic for executing and optimizing token trades
- Market Data Processing: Real-time processing of market data for informed trading decisions
- Authentication & Authorization: Secure user authentication and request validation
- Transaction Management: Handling and logging of all trading transactions
- AI Agent Integration: Integration with AI agents to optimize trading strategies

## Prerequisites
- Node.js (v16 or higher)
- PostgresDB
- Redis
- Telegram Bot Token - [Getting Telegram Bot Token](https://core.telegram.org/bots/api)
- OpenAI API Key - [Getting OpenAI API Key](https://platform.openai.com/api-keys)
- OnceInch API Key - [Getting OnceInch API Key](https://1inch.dev/)
- Para API Key - [Getting Para API Key](https://developer.getpara.com/)

## Environment Variables
Required environment variables in `.env`:
- `DATABASE_URL`: PostgreSQL database connection URL
- `AUTH_SECRET`: Secret key for authentication
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `OPENAI_API_KEY`: OpenAI API key
- `BINANCE_API_ENDPOINT`: Binance API endpoint URL
- `ONEINCH_API_ENDPOINT`: 1inch API endpoint URL
- `ONEINCH_API_KEY`: Your 1inch API key
- `REDIS_HOST`: Redis host address
- `REDIS_PORT`: Redis port number
- `REDIS_PASSWORD`: Redis password
- `PARA_API_KEY`: Your Para API key
- `CHAIN_ICON_TEMPLATE_URL`: Template URL for chain icons
- `AVAILABLE_CHAIN_IDS`: List of available blockchain network IDs
- `DEFAULT_CHAIN_ID`: Default blockchain network ID

## Running the Server
1. Install dependencies: `npm install`
2. Start development server: `npm run start:dev`
3. Access the server at `http://localhost:4000`

## Relevant Repositories
- [Basket Agent API](https://github.com/EmbraceXTech/basket-agent-backend)
- [Basket Agent Frontend](https://github.com/EmbraceXTech/basket-agent-mini-app)