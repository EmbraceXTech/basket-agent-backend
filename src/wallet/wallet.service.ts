import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PrivyClient } from '@privy-io/server-auth';
import { PRIVY_WALLET_PROVIDER } from './wallet.provider';
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';
import { config } from 'src/config';
import * as crypto from 'crypto';
import { AgentWallet } from './types/agent-wallet';

@Injectable()
export class WalletService implements OnModuleInit {
  private agentWallets: Map<string, AgentWallet> = new Map();

  constructor(
    @Inject(PRIVY_WALLET_PROVIDER) private readonly walletProvider: PrivyClient,
  ) {}

  onModuleInit() {
    Coinbase.configure({
      apiKeyName: config.cdpApiKeyName,
      privateKey: config.cdpApiKeyPrivateKey,
    });
  }

  // TODO: create agent wallet + store in db
  async createAgentWallet(agentId: string) {
    // TODO: check if agent wallet already exists
    // TODO: check ownership of agent
    try {
      const coinbaseWallet = await this.createCoinbaseWallet();
      this.agentWallets.set(agentId, coinbaseWallet);
      return coinbaseWallet;
    } catch (e) {
      throw e;
    }
  }

  async getAgentWallet(agentId: string) {
    try {
      const result = this.agentWallets.get(agentId);
      const { ivString, encryptedWalletData } = result;
      const iv = Buffer.from(ivString, 'hex');
      const walletData = JSON.parse(this.decrypt(encryptedWalletData, iv));
      return Wallet.import(walletData);
    } catch (e) {
      throw e;
    }
  }

  async transferFunds(
    agentId: string,
    recipientAddress: string,
    amount: number,
  ) {
    try {
      const agentWallet = await this.getAgentWallet(agentId);
      if (!agentWallet) {
        throw new Error('Agent wallet not found');
      }

      const transfer = await agentWallet.createTransfer({
        amount,
        assetId: Coinbase.assets.Usdc,
        destination: recipientAddress,
      });

      // Wait for the transfer to settle.
      await transfer.wait();

      // Check if the transfer successfully completed on-chain.
      if (transfer.getStatus() === 'complete') {
        console.log(`Transfer successfully completed: `, transfer.toString());
        return transfer;
      } else {
        console.error('Transfer failed on-chain: ', transfer.toString());
        throw new Error('Transfer failed on-chain');
      }
    } catch (e) {
      throw e;
    }
  }

  // private async createPrivyWallet(userId: string) {
  //   const user = await this.walletProvider.importUser({
  //     linkedAccounts: [
  //       {
  //         type: 'telegram',
  //         telegramUserId: userId,
  //       },
  //     ],
  //     createEthereumWallet: true,
  //     createSolanaWallet: true,
  //     createEthereumSmartWallet: false,
  //     customMetadata: {
  //       username: 'name',
  //       isVerified: true,
  //       age: 23,
  //     },
  //   });
  //   return user;
  // }

  private async createCoinbaseWallet() {
    try {
      const wallet = await Wallet.create({
        networkId: Coinbase.networks.BaseSepolia,
      });
      const iv = crypto.randomBytes(16);
      const encryptedWalletData = this.encrypt(
        JSON.stringify(wallet.export()),
        iv,
      );
      return {
        address: await wallet.getDefaultAddress().then((res) => res.getId()),
        ivString: iv.toString('hex'),
        encryptedWalletData,
      };
    } catch (e) {
      console.error('Error creating coinbase wallet: ', e);
      throw e;
    }
  }

  //   // if (userStates.address) {
  //   //   return userStates.address;
  //   // }

  //   let wallet;
  //   try {
  //     // const result = await db.get(user.id.toString());
  //     // const { ivString, encryptedWalletData } = result;
  //     // const iv = Buffer.from(ivString, "hex");
  //     // const walletData = JSON.parse(decrypt(encryptedWalletData, iv));
  //     // wallet = await Wallet.import(walletData);
  //   } catch (error) {
  //     // if (err.name === 'not_found' || err.status === 404) {
  //     //   wallet = await Wallet.create({ networkId: "base-mainnet" });
  //     //   const iv = crypto.randomBytes(16);
  //     //   const encryptedWalletData = encrypt(JSON.stringify(wallet.export()), iv);
  //     //   await db.put({
  //     //     _id: user.id.toString(),
  //     //     ivString: iv.toString("hex"),
  //     //     encryptedWalletData,
  //     //   });
  //     // } else {
  //     //   console.log('Error fetching from local database: ', error);
  //     // }
  //   }

  //   // updateUserState(user, { address: wallet.getDefaultAddress() });

  //   // return wallet.getDefaultAddress();
  // }

  // Encrypt and Decrypt functions
  private encrypt(text: string, iv: Buffer) {
    const encryptionKey = Buffer.from(config.cdpSkEncryptionKey, 'hex');
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
  }

  private decrypt(encrypted: string, iv: Buffer) {
    const encryptionKey = Buffer.from(config.cdpSkEncryptionKey, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
    return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
  }
}
