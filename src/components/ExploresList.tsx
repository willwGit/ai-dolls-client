/* eslint-disable @next/next/no-img-element */
'use client';
import { useTranslation } from '@/locales/client';
import { filterImage } from '@/utils/business';
import Image from 'next/image';
import { FC, useState } from 'react';

export const ExploresList: FC<{
  list: any[];
  loaded: boolean;
  total: number;
  isLoading?: boolean;
  getListEmit: () => void;
  tabItemEmit: (item: any) => void;
}> = ({
  list = [],
  loaded = false,
  total = 0,
  isLoading = false,
  getListEmit,
  tabItemEmit,
}) => {
  const [styleId, setStyleId] = useState('');
  const getList = () => {
    getListEmit();
  };

  const onTabItem = (item: any) => {
    setStyleId(item.id);
    tabItemEmit(item);
  };
  return (
    <>
      <div className="px-4 grid grid-cols-2 gap-x-2 gap-y-2">
        {list.map((item) => (
          <div
            className="overflow-hidden relative w-full h-44 rounded flex flex-col justify-end"
            key={item.id}
            onClick={() => onTabItem(item)}
          >
            <img
              src={filterImage(item.cover)}
              alt={item.label}
              className="absolute top-0 left-0 w-full h-[175px] object-cover object-top"
            />

            <div
              className="px-3 py-2 pt-0 whitespace-pre-wrap text-xs text-white absolute z-10 w-full"
              style={{
                backgroundImage:
                  'linear-gradient(to bottom, rgba(47, 43, 60, 0) 0%, rgba(42, 34, 67, 0.68) 38%, rgba(11, 4, 34, 0.86) 100%)',
              }}
            >
              <div className="flex items-center mb-1">
                <div
                  className="max-w-24 px-2 py-[2px] rounded-sm font-bold text-xs line-clamp-1"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, #665ef2 0%, #8f54ee 100%)',
                  }}
                >
                  {item.name}
                </div>
                {Boolean(item.processedPopularity) && (
                  <div
                    className="flex items-center ml-[6px] p-[2px] rounded-sm text-xs"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, #ff8f4f 0%, #ec52d4 100%)',
                    }}
                  >
                    <Image
                      width={10}
                      height={10}
                      className="popularity-icon"
                      src="/icons/fire.png"
                      alt=""
                    />
                    {item.processedPopularity}
                  </div>
                )}
              </div>
              <div className="line-clamp-4">{item.description}</div>
            </div>
            {/* H5 没用到 */}
            {/* {isDeal && styleId === item.id && (
              <div className="absolute left-2/4 top-2/4 -translate-x-2/4 -translate-y-2/4 w-full h-full rounded-md border-2 border-[#e254ee]">
                <Image
                  width={20}
                  height={20}
                  className="absolute right-[1px] bottom-[1px]"
                  src="/icons/checked-pink.png"
                  alt=""
                />
              </div>
            )} */}

            {item.label && (
              <div className="absolute top-0 right-0 px-2 py-1 min-w-10 rounded-tl-2xl rounded-bl-2xl rounded-tr text-center bg-[#f14747] text-xs text-white after:absolute after:right-0 after:bottom-0 after:translate-y-[99%] after:size-0 after:border-t-8 after:border-l-8 after:border-t-[#f14747] after:border-l-transparent">
                {item.label}
              </div>
            )}
          </div>
        ))}
      </div>
      {Boolean(total) && (
        <LoadMore
          loaded={loaded}
          isLoading={isLoading}
          emit={getList}
          martinTop="-20rpx"
        />
      )}
    </>
  );
};

export const LoadMore: FC<{
  martinTop?: string;
  loaded: boolean;
  isLoading: boolean;
  loadingTips?: string;
  loadedTips?: string;
  emit?: () => void;
}> = ({
  martinTop = '0px',
  loaded = false,
  isLoading = false,
  loadingTips = '',
  loadedTips = '',
  emit,
}) => {
  const { t } = useTranslation();
  return (
    <div
      className="-mt-3 flex items-center justify-center py-8 text-sm text-center text-[#a19ea9]"
      onClick={() => {
        if (!loaded) emit?.();
      }}
      style={{ marginTop: martinTop }}
    >
      {loaded ? (
        <div className="flex items-center">
          <div
            className="mx-1 w-11 h-[1px]"
            style={{
              backgroundImage:
                'linear-gradient(to right,rgba(239, 239, 239, 0) 0%,#7b7788 49%,rgba(239, 239, 239, 0) 100%)',
            }}
          ></div>
          {loadedTips || t('component.allDisplayed')}
          <div
            className="mx-1 w-11 h-[1px]"
            style={{
              backgroundImage:
                'linear-gradient(to right,rgba(239, 239, 239, 0) 0%,#7b7788 49%,rgba(239, 239, 239, 0) 100%)',
            }}
          ></div>
        </div>
      ) : isLoading ? (
        <div className="flex items-center gap-2">
          <span className="loading loading-spinner size-4 mr"></span>
          <span>{t('loading')}</span>
        </div>
      ) : (
        <span>{loadingTips || t('component.loadMore')}</span>
      )}
    </div>
  );
};

type EmptyProps = {
  text?: string;
  subtext?: string;
  paddingTop?: string;
  needReload?: boolean;
  reloadText?: string;
  emptyImageKey?: string;
  reload?: () => void;
};

export const Empty: FC<EmptyProps> = ({
  text = '',
  subtext = '',
  paddingTop = '15vh',
  needReload = false,
  reloadText = '',
  emptyImageKey = '',
  reload,
}) => {
  const { t } = useTranslation();

  return (
    <div className="px-14 text-center" style={{ paddingTop }}>
      <Image
        className="mx-auto mb-1"
        width={164}
        height={164}
        src={`/images/${emptyImageKey}-empty.png`}
        alt=""
      ></Image>
      <div className="mb-2 text-xl text-white">
        {needReload ? t('component.loadFail') : text}
      </div>

      {!needReload && <div className="text-lg text-[#625e6f]">{subtext}</div>}

      {needReload || reloadText ? (
        <div className="py-5 flex justify-center">
          <div
            onClick={() => reload?.()}
            className="flex justify-center items-center px-3 min-w-28 h-11 rounded-md text-lg font-bold text-white"
            style={{
              backgroundImage:
                'linear-gradient(to right, #7e78e4 0%, #9e6ed1 100%)',
            }}
          >
            {reloadText ? reloadText : t('component.reload')}
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};
