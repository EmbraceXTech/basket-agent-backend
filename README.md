# Basket Agent Backend
This project provides agent interaction functionality for autonomous trading strategies with pre-defined risk/profit control.

## Development

```bash
npm install
```

```bash
npm run dev
```

# Data Sources

## Chains
- src/common/constants/chains/chains.json - list of chains retrived from https://chainid.network/chains.json.

## Tokens
- src/common/constants/tokens - list of tokens retrived from https://api.1inch.dev/swap/v6.0/{{chain}}/tokens

## Chain Icons
- list of chain icons are retrived using template url: https://api.llamao.fi/v3/icons/chains/rsz_{chain_name}.jpg