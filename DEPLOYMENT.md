# Flash Markets - Deployment Guide

Complete guide for deploying Flash Markets to Conway Testnet and local environments.

## Quick Start (Local)

### Prerequisites
```bash
# Install Rust 1.86.0
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup override set 1.86.0

# Install wasm target
rustup target add wasm32-unknown-unknown

# Install Linera CLI
cargo install linera-service
```

### Build Applications
```bash
# Option 1: Use build script
./build.sh

# Option 2: Use Makefile
make build

# Option 3: Manual build
cargo build --release --target wasm32-unknown-unknown
```

### Start Local Network
```bash
# Start Linera network
linera net up

# This creates a local test network with validators
```

### Deploy Applications
```bash
# Publish and create Token app
linera project publish-and-create token \
  --path token \
  --name "Flash Markets Token" \
  --args '{"master_chain": "YOUR_CHAIN_ID", "initial_supply": "1000000000000", "daily_bonus": "25000000000"}'

# Publish and create Market app
linera project publish-and-create market \
  --path market \
  --name "Flash Markets" \
  --args '{"token_app": "TOKEN_APP_ID", "platform_wallet": "YOUR_WALLET"}'

# Publish and create Oracle app
linera project publish-and-create oracle \
  --path oracle \
  --name "Flash Markets Oracle" \
  --args '{"market_app": "MARKET_APP_ID"}'
```

### Start GraphQL Service
```bash
linera service --port 8080

# Service will be available at http://localhost:8080/graphql
```

## Docker Deployment

### Option 1: Docker Compose (Recommended)
```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Option 2: Docker Manual
```bash
# Build image
docker build -t flash-markets .

# Run container
docker run -p 8080:8080 -p 3000:3000 flash-markets

# Run with volume
docker run -v $(pwd):/app -p 8080:8080 flash-markets
```

## Conway Testnet Deployment

### 1. Setup Testnet Wallet
```bash
# Generate new wallet
linera keygen

# Get testnet tokens from faucet
# Visit: https://faucet.linera.dev
```

### 2. Configure Testnet Connection
```bash
# Set testnet as default
linera config set-default-network conway

# Verify connection
linera query-balance
```

### 3. Deploy to Testnet
```bash
# Build applications
./build.sh

# Deploy Token app
linera project publish-and-create token \
  --path token \
  --network conway \
  --name "Flash Markets Token"

# Deploy Market app
linera project publish-and-create market \
  --path market \
  --network conway \
  --name "Flash Markets"

# Deploy Oracle app
linera project publish-and-create oracle \
  --path oracle \
  --network conway \
  --name "Flash Markets Oracle"
```

### 4. Start Testnet Service
```bash
# Start GraphQL service pointing to testnet
linera service --network conway --port 8080

# Access at: https://YOUR_DOMAIN:8080/graphql
```

## Application IDs

After deployment, save your application IDs:

```bash
# Token App ID
export TOKEN_APP="e476187f6ddfeb9d588c7b45d3df334d5501d6499b3f9ad5595cae86cce16a65010000000000000000000000"

# Market App ID
export MARKET_APP="e476187f6ddfeb9d588c7b45d3df334d5501d6499b3f9ad5595cae86cce16a65020000000000000000000000"

# Oracle App ID
export ORACLE_APP="e476187f6ddfeb9d588c7b45d3df334d5501d6499b3f9ad5595cae86cce16a65030000000000000000000000"
```

## Testing Deployment

### 1. Test Token App
```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { accounts { keys } }"
  }'
```

### 2. Test Market Creation
```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createMarket(marketType: { binaryEvent: { question: \"Test?\" } }, durationMinutes: 5) }"
  }'
```

### 3. Test Oracle
```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { submitPrice(symbol: \"BTC\", price: 50000) }"
  }'
```

## Environment Variables

Create a `.env` file:

```bash
# Network
LINERA_NETWORK=conway  # or 'local'

# Application IDs
TOKEN_APP_ID=your_token_app_id
MARKET_APP_ID=your_market_app_id
ORACLE_APP_ID=your_oracle_app_id

# Service
GRAPHQL_PORT=8080
FRONTEND_PORT=3000

# Wallet
WALLET_ADDRESS=your_wallet_address
MASTER_CHAIN=your_master_chain_id

# Platform
PLATFORM_FEE=5
MIN_BET=100000
MARKET_CREATION_FEE=1000000
```

## Troubleshooting

### Build Failures

**Problem:** `error: linking with 'rust-lld' failed`
```bash
# Solution: Clean and rebuild
cargo clean
rustup update
./build.sh
```

**Problem:** `cannot find -lwasmer`
```bash
# Solution: Install wasmer feature
cargo build --features wasmer --target wasm32-unknown-unknown
```

### Deployment Failures

**Problem:** `Chain not found`
```bash
# Solution: Create a new chain first
linera create-chain
```

**Problem:** `Insufficient funds`
```bash
# Solution: Get testnet tokens
# Visit faucet: https://faucet.linera.dev
```

### Service Failures

**Problem:** `Port already in use`
```bash
# Solution: Use different port
linera service --port 8081

# Or kill existing process
lsof -ti:8080 | xargs kill -9
```

## Production Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Error handling reviewed
- [ ] Logging configured
- [ ] Monitoring setup
- [ ] Backup strategy defined
- [ ] Rate limiting implemented
- [ ] Documentation updated
- [ ] Team trained on operations
- [ ] Rollback plan prepared

## Monitoring

### Health Checks
```bash
# Check service health
curl http://localhost:8080/health

# Check application status
linera query-application $MARKET_APP

# View logs
docker compose logs -f flash-markets
```

### Metrics to Monitor
- Transaction throughput
- Market creation rate
- Bet placement latency
- Resolution accuracy
- User balance changes
- Error rates

## Support

For deployment issues:
- GitHub Issues: https://github.com/YOUR_REPO/issues
- Discord: @yourhandle
- Email: your@email.com

## References

- Linera Docs: https://docs.linera.io
- Conway Testnet: https://testnet.linera.dev
- Faucet: https://faucet.linera.dev
- Explorer: https://explorer.linera.dev
