'use client';

import { useSystemStore } from '@/hooks/use-system';
import { AppConfigEnv } from '@/lib/utils';
import { createDebounce, debounce } from '@/utils/debounce-throttle';
import { fetchRequest } from '@/utils/request';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export const Slogans = () => {
  const { push } = useRouter();
  const [currentMessage, setCurrentMessage] = useState('');
  let messageIndex = 0;
  const { systemState } = useSystemStore();
  const [debounce, clearFun] = createDebounce();
  let timer: NodeJS.Timeout | null = null;

  const initSlogans = () => {
    const { slogans } = systemState;

    if (!slogans.length) return;
    if (timer) clearInterval(timer);

    const { content = '' } = slogans[messageIndex] || {};
    setCurrentMessage(content);
    timer = setInterval(() => {
      nextMessage();
    }, 16000);
  };

  const nextMessage = () => {
    const { slogans } = systemState;
    // console.log('下一个');

    if (!slogans.length) return;

    messageIndex = (messageIndex + 1) % slogans.length;
    setCurrentMessage(
      slogans[messageIndex] ? slogans[messageIndex].content : ''
    );
  };

  const onTabSlogan = () => {
    const { slogans } = systemState;
    const { extension = {} } = slogans[messageIndex] || {};
    const { styleId } = extension;
    if (!styleId) return;
    fetchRequest(
      `/restApi/friendStyle/random?reviewVersion=${AppConfigEnv.APPVERSIONCODE}&type=H5`,
      {
        styleId,
      }
    ).then(({ code, result }) => {
      if (code === 1001) {
        push(`/create-result?source=unlock_girl`);
        return;
      }
      const { id } = result;
      push(`/chat?friendId=${id}`);
    });
  };

  useEffect(() => {
    debounce(initSlogans);
    return () => {
      clearFun();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemState.slogans]);

  return (
    <div className="overflow-hidden flex -mt-4 mx-5 mb-4 w-full">
      <div
        className="slogan pl-[100%] box-content whitespace-nowrap text-sm text-white"
        onClick={() => debounce(onTabSlogan, 500)}
      >
        <span>{currentMessage}</span>
      </div>
    </div>
  );
};
