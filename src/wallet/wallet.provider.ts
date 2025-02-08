import { config } from '../config';
import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import { PrivyClient } from '@privy-io/server-auth';

export const PRIVY_WALLET_PROVIDER = "PRIVY_WALLET_PROVIDER";
export const COINBASE_WALLET_PROVIDER = "COINBASE_WALLET_PROVIDER";

export const privyWalletProvider = {
  provide: PRIVY_WALLET_PROVIDER,
  useFactory: () => {
    return new PrivyClient(config.privyAppId, config.privyAppSecret);
  },
};
