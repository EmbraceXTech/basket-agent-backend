import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';
import { config } from 'src/config';
import * as crypto from 'crypto';
import { WithdrawTokenDto } from './dto/withdraw-token.dto';
import { DrizzleAsyncProvider } from 'src/db/drizzle.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/db/schema';
import { eq } from 'drizzle-orm';
import { COINBASE_CHAIN_ID_HEX_MAP } from './constants/coinbase.const';

@Injectable()
export class WalletService implements OnModuleInit {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  onModuleInit() {
    Coinbase.configure({
      apiKeyName: config.cdpApiKeyName,
      privateKey: config.cdpApiKeyPrivateKey,
    });
  }

  async createAgentWallet(chainIdHex: string) {
    return this.createCoinbaseWallet(chainIdHex);
  }

  async getBalance(agentId: string) {
    try {
      const wallet = await this.getCoinbaseWallet(agentId);
      console.log('wallet', wallet);
      const balances = await wallet.listBalances();
      console.log('balances', balances);
      return {
        balances: Array.from(balances),
      };
    } catch (e) {
      throw e;
    }
  }

  async findByAgentId(agentId: string) {
    const result = await this.db.query.walletKeysTable.findFirst({
      where: eq(schema.walletKeysTable.agentId, +agentId),
    });
    return result;
  }

  async withdraw(agentId: string, withdrawTokenDto: WithdrawTokenDto) {
    return this.transferFromAgent(
      agentId,
      withdrawTokenDto.recipientAddress,
      withdrawTokenDto.amount,
    );
  }

  async transferFromAgent(
    agentId: string,
    recipientAddress: string,
    amount: number,
  ) {
    try {
      const agentWallet = await this.getCoinbaseWallet(agentId);
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

  async faucet(agentId: string, token: string) {
    try {
      const wallet = await this.getCoinbaseWallet(agentId);
      const faucetTx = await wallet.faucet(token);
      await faucetTx.wait();
      return {
        transactionHash: faucetTx.getTransactionHash(),
      };
    } catch (e) {
      throw e;
    }
  }

  private async getCoinbaseWallet(agentId: string) {
    try {
      const agentWalletInfo = await this.findByAgentId(agentId);
      const { ivString, encryptedWalletData } = agentWalletInfo;
      const iv = Buffer.from(ivString, 'hex');
      const walletData = JSON.parse(this.decrypt(encryptedWalletData, iv));
      return Wallet.import(walletData);
    } catch (e) {
      throw e;
    }
  }

  private async createCoinbaseWallet(chainIdHex: string) {
    try {
      const wallet = await Wallet.create({
        networkId: COINBASE_CHAIN_ID_HEX_MAP[chainIdHex].id,
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
