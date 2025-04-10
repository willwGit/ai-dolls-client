/* eslint-disable @next/next/no-img-element */
'use client';

import { filterImage } from '@/utils/business';
import { FC } from 'react';

export const Mask: FC<{
  detail: Indexes;
}> = ({ detail }) => {
  return (
    <>
      <img
        className="absolute left-0 top-0 w-full h-24"
        src="/images/result-top.png"
        alt=""
      />
      <div className="flex flex-col absolute top-0 left-0 w-full h-full">
        <div
          className="relative mt-24 w-full"
          style={{
            background: 'rgba(24, 20, 37, 0.2)',
          }}
        >
          <div
            className="absolute left-0 top-0 w-full h-20"
            style={{
              backgroundImage:
                'linear-gradient(180deg,#181425 0,rgba(24,20,37,0))',
            }}
          ></div>

          {!!detail.head && (
            <img
              className="h-[390px] w-full object-cover object-top"
              src={filterImage(detail.head)}
              alt=""
            />
          )}
        </div>

        <div className="absolute bottom-0 left-0 w-full">
          <div
            className="w-full h-20 relative"
            style={{
              backgroundImage: 'linear-gradient(rgba(24,20,37,0),#181425)',
            }}
          ></div>
          <div className="w-full h-[calc(100vh-theme(height.20)-390px)] bg-[#181425]"></div>
          <img
            className="absolute left-0 bottom-0 w-full h-[calc(100vh-theme(height.20)-390px)]"
            src="/images/result-bottom.png"
            alt=""
          />
        </div>
      </div>
    </>
  );
};
