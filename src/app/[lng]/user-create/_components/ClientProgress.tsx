'use client';
import { FC } from 'react';

export const ClientProgress: FC<{
  headerItems: any[];
  activeTab: number;
}> = ({ headerItems, activeTab }) => {
  return (
    <div className="container__header flex-container flex items-center justify-center bg-[#272032] h-12 mb-8">
      {headerItems.map((item, index) => (
        <div
          className={`header__item flex items-center font-bold ${
            activeTab >= index ? 'text-white group active' : 'text-[#a19ea9]'
          }`}
          key={item}
        >
          <div className="item__tag group-[.active]:bg-[#8f7ecc] flex justify-center items-center mx-1 w-6 h-4 rounded-full text-xs bg-[#413b5d]">
            {index + 1}
          </div>
          <div className="item__label font-bold text-sm">{item}</div>
          {index !== 2 && (
            <div className="item__line mx-2 w-6 h-[2px] bg-[#413b5d]"></div>
          )}
        </div>
      ))}
    </div>
  );
};
