import { config } from 'src/config';
import { PrivyClient } from '@privy-io/server-auth';

export const PRIVY_WALLET_PROVIDER = "PRIVY_WALLET_PROVIDER";

export const privyWalletProvider = {
  provide: PRIVY_WALLET_PROVIDER,
  useFactory: () => {
    return new PrivyClient(config.privyAppId, config.privyAppSecret);
  },
};
