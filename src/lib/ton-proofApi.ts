'use client';
import {
  Account,
  ConnectAdditionalRequest,
  TonProofItemReplySuccess,
} from '@tonconnect/ui-react';
import Cookies from 'js-cookie';

class TonProofDemoApiService {
  private localStorageKey = 'token';

  public accessToken: string | null = null;

  public readonly refreshIntervalMs = Number(process.env.TIME);

  constructor() {
    this.accessToken = Cookies.get(this.localStorageKey) || null;

    if (!this.accessToken) {
      this.generatePayload();
    }
  }

  async generatePayload(): Promise<ConnectAdditionalRequest | null> {
    try {
      const response = await (
        await fetch(`/api/generatePayload`, {
          method: 'POST',
        })
      ).json();
      return { tonProof: response.payload as string };
    } catch {
      return null;
    }
  }

  async checkProof(proof: TonProofItemReplySuccess['proof'], account: Account) {
    try {
      const reqBody = {
        address: account.address,
        network: account.chain,
        proof: {
          ...proof,
          state_init: account.walletStateInit,
        },
      };

      const response = await (
        await fetch(`/api/ton-check`, {
          method: 'POST',
          body: JSON.stringify({ ...reqBody }),
        })
      ).json();
      return response;
    } catch (e: any) {
      console.log('checkProof error:', e);
      throw new Error(e.message || 'signature verification failed');
    }
  }

  reset() {
    this.generatePayload();
  }
}

export const TonProofDemoApi = new TonProofDemoApiService();
