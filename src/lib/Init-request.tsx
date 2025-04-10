/*
 * @Author: peng-xiao-shuai
 * @Date: 2024-04-03 08:21:04
 * @LastEditors: peng-xiao-shuai
 * @LastEditTime: 2024-04-07 03:54:07
 * @Description:
 */
'use client';
import { useBusWatch } from '@/hooks/use-bus-watch';
import { useSystemStore } from '@/hooks/use-system';
import { useUserStore } from '@/hooks/use-user';
import { Lng } from '@/locales/i18n';
import { createDebounce } from '@/utils/debounce-throttle';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { AppConfigEnv } from './utils';
import Cookies from 'js-cookie';
import VC from 'vconsole';

const InitRequest = ({ lng }: { lng: Lng }) => {
  const { push, replace } = useRouter();
  const { initSystemData } = useSystemStore();
  const { setData } = useUserStore();
  const [debounce, clearTimeFun] = createDebounce();
  const { logout } = useAuth0();
  useBusWatch('logout', () => {
    if (AppConfigEnv.isTG) {
      if (Boolean(window.Telegram.WebApp.initData)) {
        replace(`/${lng}/login/`);
      } else {
        logout({
          logoutParams: {
            returnTo: window.origin + `/${lng}/login/`,
          },
        });
      }
    } else {
      logout({
        logoutParams: {
          returnTo: window.origin + `/${lng}/login/`,
        },
      });
    }
  });
  useEffect(() => {
    debounce(() => {
      if (!AppConfigEnv.isTG || !Boolean(window.Telegram?.WebApp.initData)) {
        initSystemData();
        if (typeof window != 'undefined' && Cookies.get('token')) {
          setData().then((userInfo) => {
            if (userInfo.premiumStatus === 'NONE') {
              // if (
              //   !location.pathname.includes('/create-result') &&
              //   !location.pathname.includes('/create-options') &&
              //   !location.pathname.includes('/login')
              // ) {
              //   push(`/${lng}/create-result?source=open_app`);
              // }
            }
          });
        }
      }
    });

    let Log: VC;

    if (
      process.env.NODE_ENV === 'development' &&
      typeof window != 'undefined'
    ) {
      // Log = new VC();
    }

    return () => {
      clearTimeFun();
      // Log?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <></>;
};

export default InitRequest;
