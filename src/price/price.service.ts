import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { config } from '../config';
import { BinancePriceResponse } from './interfaces/binance-response.interface';
import { PriceResponse } from './interfaces/price-response.interface';
import { OneInchPriceResponse } from './interfaces/oneinch-response.interface';
import { TokenService } from 'src/token/token.service';
import { TokenInfo } from 'src/token/interfaces/token-info.interface';

@Injectable()
export class PriceService {
  constructor(private readonly tokenService: TokenService) {}

  async getPrices(tokens: string[], chainId = config.defaultChainId) {
    const upperCaseTokens = tokens.map((token) => token.toUpperCase());

    const tokenList = await this.tokenService.getAvailableTokens(chainId);
    const foundUnavailableTokens = upperCaseTokens.filter(
      (token) => !tokenList.some((t) => t.symbol === token),
    );
    if (foundUnavailableTokens.length > 0) {
      throw new Error(
        `Tokens ${foundUnavailableTokens.join(', ')} are not available`,
      );
    }

    const priceResults: (PriceResponse | null)[] = [];
    try {
      const nullResultIndices: number[] = [];
      upperCaseTokens.forEach((_, index) => {
        if (!priceResults[index]) {
          nullResultIndices.push(index);
        }
      });
      if (nullResultIndices.length === 0) return priceResults;
      const targetTokens = upperCaseTokens.filter((_, index) => nullResultIndices.includes(index));
      const priceUsdcResults = await Promise.allSettled(
        targetTokens.map(this.getPriceFromBinanceUSDC),
      );
      priceUsdcResults.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value) {
          const index = nullResultIndices[i];
          priceResults[index] = {
            token: upperCaseTokens[index],
            price: Number(result.value),
            source: 'binance',
            quote: 'USDC',
          };
        }
      });
    } catch (e) {}

    try {
      const nullResultIndices: number[] = [];
      upperCaseTokens.forEach((_, index) => {
        if (!priceResults[index]) {
          nullResultIndices.push(index);
        }
      });
      if (nullResultIndices.length === 0) return priceResults;
      const targetTokens = upperCaseTokens.filter((_, index) => nullResultIndices.includes(index));
      const priceUsdtResults = await Promise.allSettled(
        targetTokens.map(this.getPriceFromBinanceUSDT),
      );
      priceUsdtResults.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value) {
          const index = nullResultIndices[i];
          priceResults[index] = {
            token: upperCaseTokens[index],
            price: Number(result.value),
            source: 'binance',
            quote: 'USDT',
          };
        }
      });
    } catch (e) {}

    try {
      const nullResultIndices: number[] = [];
      upperCaseTokens.forEach((_, index) => {
        if (!priceResults[index]) {
          nullResultIndices.push(index);
        }
      });
      if (nullResultIndices.length === 0) return priceResults;
      const targetTokens = upperCaseTokens.filter((_, index) => nullResultIndices.includes(index));
      const priceOneInchResults = await this.getPriceFromOneInch(
        targetTokens,
        chainId,
      );
      priceOneInchResults.forEach((price, i) => {
        if (price) {
          const index = nullResultIndices[i];
          priceResults[index] = {
            token: upperCaseTokens[index],
            price: Number(price),
            source: 'oneinch',
            quote: 'USD',
          };
        }
      });
    } catch (e) {}
    return priceResults;
  }

  async getPriceFromBinanceUSDC(token: string) {
    const symbol = `${token}USDC`.toUpperCase();
    return axios
      .get<BinancePriceResponse>(
        `${config.binanceApiEndpoint}/api/v3/ticker/price?symbol=${symbol}`,
      )
      .then((response) => response.data.price);
  }

  async getPriceFromBinanceUSDT(token: string) {
    const symbol = `${token}USDT`.toUpperCase();
    return axios
      .get<BinancePriceResponse>(
        `${config.binanceApiEndpoint}/api/v3/ticker/price?symbol=${symbol}`,
      )
      .then((response) => response.data.price);
  }

  async getPriceFromOneInch(tokens: string[], chainId = config.defaultChainId) {
    const url = `${config.oneinchApiEndpoint}/price/v1.1/${chainId}`;
    const availableTokens = await this.tokenService.getAvailableTokens(chainId);
    const tokenMap = availableTokens.reduce(
      (acc, token) => {
        acc[token.symbol] = token;
        return acc;
      },
      {} as Record<string, TokenInfo>,
    );
    const tokenInfoList = tokens.map((t) => tokenMap[t]);
    if (!tokenInfoList.every((t) => t)) {
      const notFoundTokens = tokens.filter((t) => !tokenMap[t]);
      throw new Error(`Tokens ${notFoundTokens.join(', ')} not found`);
    }

    return axios
      .post<OneInchPriceResponse>(
        url,
        {
          tokens: tokenInfoList.map((t) => t.address),
          currency: 'USD',
        },
        {
          headers: {
            Authorization: `Bearer ${config.oneinchApiKey}`,
          },
        },
      )
      .then((response) => {
        const result = tokenInfoList.map((tokenInfo) => {
          return Number(response.data[tokenInfo.address]);
        });
        return result;
      });
  }
}
