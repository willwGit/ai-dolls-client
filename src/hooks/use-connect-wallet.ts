'use client';
import useInterval from '@/hooks/use-interval';
import {
  useTonConnectModal,
  useTonConnectUI,
  CHAIN,
  useTonAddress,
} from '@tonconnect/ui-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TonProofDemoApi } from '@/lib/ton-proofApi';
import { toast } from 'sonner';
import { useUserStore } from '@/hooks/use-user';
import emitter from '@/utils/bus';

interface useConnectWalletProps {
  bindSuccessCB?: () => void;
}

export const useConnectWallet = ({
  bindSuccessCB,
}: useConnectWalletProps = {}) => {
  const { state, open } = useTonConnectModal();
  const { userState, setDataLocal } = useUserStore();
  const address = useTonAddress(true);
  const [isCheck, setIsCheck] = useState(Boolean(address));
  const firstProofLoading = useRef<boolean>(true);
  const [tonConnectUI] = useTonConnectUI();

  const handleOpen = async () => {
    if (tonConnectUI.connected) {
      await tonConnectUI.disconnect();
    }

    open();
  };

  const recreateProofPayload = useCallback(async () => {
    if (firstProofLoading.current) {
      tonConnectUI?.setConnectRequestParameters({ state: 'loading' });
      firstProofLoading.current = false;
    }

    const payload = await TonProofDemoApi.generatePayload();

    if (payload) {
      tonConnectUI?.setConnectRequestParameters({
        state: 'ready',
        value: payload,
      });
    } else {
      tonConnectUI?.setConnectRequestParameters(null);
    }
  }, [tonConnectUI, firstProofLoading]);

  if (firstProofLoading.current) {
    recreateProofPayload();
  }

  useInterval(recreateProofPayload, TonProofDemoApi.refreshIntervalMs);

  useEffect(() => {
    const unChange = tonConnectUI.onStatusChange(async (w) => {
      console.log('w ==>', w);

      if (!w) {
        TonProofDemoApi.reset();
        return;
      }

      if (w.account.chain === CHAIN.TESTNET) {
        toast('You cannot log in using the test network!');
        return;
      }

      if (w.connectItems?.tonProof && 'proof' in w.connectItems.tonProof) {
        try {
          emitter.emit('setGlobalLoading', true);
          setIsCheck(false);
          const { result, ok } = await TonProofDemoApi.checkProof(
            w.connectItems.tonProof.proof,
            w.account
          );

          if (ok) {
            setIsCheck(true);
            setDataLocal(result);
          } else {
            toast('Check failure');
          }
          emitter.emit('setGlobalLoading', false);

          bindSuccessCB?.();
          // toast('Binding successful');
        } catch (msg: any) {
          toast(msg);
          emitter.emit('setGlobalLoading', false);
          tonConnectUI.disconnect();
        }
      }
    });

    return () => {
      unChange();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    handleOpen,
    isCheck,
  };
};
