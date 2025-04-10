'use client';

import { useCountDownStore } from '@/hooks/use-count-down';
import { useUserStore } from '@/hooks/use-user';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { CenterPopup } from './CenterPopup';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/locales/client';
import AppConfigEnv from '@/lib/utils';
import { useSystemStore } from '@/hooks/use-system';
import { createDebounce } from '@/utils/debounce-throttle';

export const TGInitScript = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const [ageVisible, setAgeVisible] = useState(false);
  const setData = useUserStore.getState().setData;
  const { initSystemData } = useSystemStore();
  const [debounce, clearTimeFun] = createDebounce();
  const countDownState = useCountDownStore.getState().countDownState;
  let initData = '';

  const TGWebAppReady = () => {
    const WebApp = window.Telegram.WebApp;

    if (Boolean(WebApp.initData)) {
      AppConfigEnv.APPVERSIONCODE = 110;
      console.log(AppConfigEnv);
    }

    if (!Boolean(WebApp.initData)) return;
    // WebApp.BackButton.show();
    // WebApp.SettingsButton.show();
    const params: Indexes<string> = {};
    const paramsEach = WebApp.initDataUnsafe.start_param?.split('_');
    paramsEach?.forEach((item: string, index: number) => {
      if (index % 2 === 0) {
        params[item] = paramsEach[index + 1];
      }
    });

    if (params.url && params.uid && params.sn) {
      router.replace(`/${params.url}?uid=${params.uid}&sn=${params.sn}`);

      window.localStorage.setItem(
        'auth-cache-url',
        JSON.stringify({
          pathname: '/' + params.url,
          search: `?uid=${params.uid}&sn=${params.sn}`,
        })
      );
    }

    /**
     * 存储邀请码
     */
    if (params.inviteCode) {
      window.localStorage.setItem('inviteCode', params.inviteCode);
    }

    /**
     * 静默登录
     */
    if (WebApp.initDataUnsafe.user) {
      initData = `query_id=${
        WebApp.initDataUnsafe.query_id
      }&user=${encodeURIComponent(
        JSON.stringify(WebApp.initDataUnsafe.user)
      )}&auth_date=${WebApp.initDataUnsafe.auth_date}&hash=${
        WebApp.initDataUnsafe.hash
      }`;

      const sendRequest = async () => {
        const { result } = await (
          await fetch('/api/tg-login', {
            method: 'POST',
            body: JSON.stringify({ initData, source: params.source || 'auto' }),
          })
        ).json();

        const { token, isRegister, memberDetail = {} } = result;
        Cookies.set('token', token, { expires: 365 * 20 });
        setData().then((userInfo) => {
          const uIds = JSON.parse(
            window.localStorage.getItem('userId') || '[]'
          );

          if (
            (userInfo.premiumStatus === 'NONE' || countDownState.isEnd) &&
            uIds.includes(userInfo.id)
          ) {
            uIds.splice(uIds.indexOf(userInfo.id), 1);
            window.localStorage.setItem('userId', JSON.stringify(uIds));

            router.replace('/create-result?source=open_app');
          }
        });
        if (isRegister) fbq('track', 'CompleteRegistration');
      };

      sendRequest();
    }

    debounce(() => {
      initSystemData();
      if (typeof window != 'undefined' && Cookies.get('token')) {
        setData().then((userInfo) => {
          clearTimeFun();
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
    });
  };

  useEffect(() => {
    if (
      !localStorage.getItem('age') &&
      Boolean(window.Telegram?.WebApp.initData)
    ) {
      setAgeVisible(true);
    }
  }, []);

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        onReady={TGWebAppReady}
      ></Script>

      <CenterPopup
        open={ageVisible}
        title={'Are you over 18 years old?'}
        // subtitle={t('userCreate.exitingTip')}
        confirmText={t('component.comfirm')}
        cancleText={t('component.cancel')}
        isBlack
        plain
        plainBtn
        onClose={() => {
          localStorage.setItem('age', '18-');
          setAgeVisible(false);
        }}
        onConfirm={() => {
          localStorage.setItem('age', '18+');
          setAgeVisible(false);
        }}
      />
    </>
  );
};
