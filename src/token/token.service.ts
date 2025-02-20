import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { promises as fs } from 'fs';
import { TokenInfo, TokenInfoMap } from './interfaces/token-info.interface';
import { config } from 'src/config';

@Injectable()
export class TokenService {
  async readTokenList(chainId: number | string): Promise<TokenInfoMap> {
    const filePath = join(
      __dirname,
      '..',
      '..',
      '..',
      'data',
      'tokens',
      `${chainId.toString()}.json`,
    );
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  }

  async getAvailableTokens(
    chainId: number | string,
    includeTokenBase?: boolean,
  ): Promise<TokenInfo[]> {
    const isChainAvailable = config.availableChainIds.includes(
      chainId.toString(),
    );
    if (!isChainAvailable) {
      throw new Error(`Chain ${chainId} is not available`);
    }

    const tokenList = await this.readTokenList(chainId);
    const tokens = Object.values(tokenList).filter((token) =>
      config.availableTokens.includes(token.symbol),
    );

    if (includeTokenBase) {
      const basedToken = await this.getBasedToken(chainId);
      tokens.push(basedToken);
    }

    return tokens;
  }

  async getBasedToken(chainId: number | string): Promise<TokenInfo> {
    const tokenList = await this.readTokenList(chainId);
    return Object.values(tokenList).find(
      (token) => token.symbol.toUpperCase() === 'USDC',
    );
  }
}
