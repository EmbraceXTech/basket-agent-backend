import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { config } from '../config';
import { BinancePriceResponse } from './interfaces/binance-response.interface';
import { PriceResponse } from './interfaces/price-response.interface';
import { OneInchPriceResponse } from './interfaces/oneinch-response.interface';
import { TokenService } from 'src/token/token.service';

@Injectable()
export class PriceService {
  constructor(private readonly tokenService: TokenService) {}

  async getPrice(token: string, chainId = config.defaultChainId) {
    const upperCaseToken = token.toUpperCase();

    const isTokenAvailable = config.availableTokens.includes(upperCaseToken);
    if (!isTokenAvailable) {
      throw new Error(`Token ${upperCaseToken} is not available`);
    }

    let priceResult: PriceResponse | null = null;
    try {
        const priceUsdc = await this.getPriceFromBinanceUSDC(upperCaseToken);
        priceResult = {
            asset: upperCaseToken,
            price: Number(priceUsdc),
            source: 'binance',
            quote: 'USDC',
        };
        return priceResult;
    } catch (e) {}

    try {
        const priceUsdt = await this.getPriceFromBinanceUSDT(upperCaseToken);
        priceResult = {
            asset: upperCaseToken,
            price: Number(priceUsdt),
            source: 'binance',
            quote: 'USDT',
        };
        return priceResult;
    } catch (e) {}

    try {
      const priceOneInch = await this.getPriceFromOneInch(upperCaseToken, chainId);
      priceResult = {
        asset: upperCaseToken,
        price: Number(priceOneInch),
        source: 'oneinch',
        quote: 'USDC',
      };
      return priceResult;
    } catch (e) {}
    return priceResult;
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

  async getPriceFromOneInch(token: string, chainId = config.defaultChainId) {
    const url = `${config.oneinchApiEndpoint}/price/v1.1/${chainId}`;
    const tokens = await this.tokenService.getAvailableTokens(chainId);
    const tokenInfo = tokens.find((t) => t.symbol === token);
    if (!tokenInfo) throw new Error(`Token ${token} not found`);

    return axios
      .post<OneInchPriceResponse>(
        url,
        {
          tokens: [tokenInfo.address],
          currency: 'USD',
        },
        {
          headers: {
            Authorization: `Bearer ${config.oneinchApiKey}`,
          },
        },
      )
      .then((response) => response.data[tokenInfo.address]);
  }
}
