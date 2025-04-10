'use client';

import { useTranslation } from '@/locales/client';
import { filterPrice } from '@/utils/business';
import { RadioGroup, RadioGroupItem } from '@radix-ui/react-radio-group';
import Image from 'next/image';
import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FaCheck } from 'react-icons/fa6';
import { fetchRequest } from '@/utils/request';
import { AppConfigEnv, cn } from '@/lib/utils';
import { debounce } from '@/utils/debounce-throttle';

export const ClientHead: FC<{
  goToChat: () => void;
  isPremium: boolean;
  creating: boolean;
}> = ({ goToChat, isPremium, creating }) => {
  const { t } = useTranslation();
  return (
    <div className="flex justify-between items-center px-4 h-14 text-lg">
      <div
        onClick={() => {
          toast(t('createResult.restoreTip'));
        }}
      >
        {!(isPremium && creating) ? t('createResult.restore') : ' '}
      </div>
      <Image
        onClick={goToChat}
        width={28}
        height={28}
        src="/icons/close.png"
        alt="close"
      />
    </div>
  );
};

export const ClientDesc: FC<{
  isPremium: boolean;
  creating: boolean;
  beCloseText: string;
}> = ({ isPremium, creating, beCloseText }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="mb-4 text-3xl font-bold">
        {creating && isPremium ? t('createResult.haveFun') : beCloseText}
      </div>
      <div className="mb-7 text-lg leading-8">
        <div className="flex justify-center items-center px-9">
          <div className="w-1 h-1 rounded-full bg-white mr-2 flex-shrink-0 rtl:ml-2 rtl:!mr-0"></div>
          {t('indexMine.unlimitedRoleplay')}
        </div>
        <div className="flex justify-center items-center px-9">
          <div className="w-1 h-1 rounded-full bg-white mr-2 flex-shrink-0 rtl:ml-2 rtl:!mr-0"></div>
          {t('indexMine.romantic')}
        </div>
        <div className="flex justify-center items-center px-9">
          <div className="w-1 h-1 rounded-full bg-white mr-2 flex-shrink-0 rtl:ml-2 rtl:!mr-0"></div>
          {t('createResult.doWhatever')}
        </div>
        <div className="flex justify-center items-center px-9">
          <div className="w-1 h-1 rounded-full bg-white mr-2 flex-shrink-0 rtl:ml-2 rtl:!mr-0"></div>
          {t('indexMine.features')}
        </div>
      </div>
    </>
  );
};

export const ClientPay: FC<{
  payType: string;
  paysType: {
    label: string;
    payValue: string;
    isTG?: boolean;
  }[];
  onSubscribe: (meal: any) => void;
  setPayType: Dispatch<SetStateAction<string>>;
}> = ({ payType, paysType, setPayType, onSubscribe }) => {
  const { t } = useTranslation();

  const map = {
    PERMANENT: t('createResult.lifetime'),
    ANNUAL: ` / ${t('createResult.year')}`,
    MONTHLY: ` / ${t('createResult.month')}`,
    WEEKLY: ` / ${t('createResult.week')}`,
  };

  const filterUnit = (type: keyof typeof map) => {
    return map[type] || '';
  };

  const [meals, setMeals] = useState([]);
  const getMeal = () => {
    fetchRequest('/restApi/setMeal/list/web').then(({ result }) => {
      setMeals(result.rows || []);
    });
  };

  useEffect(() => {
    getMeal();
  }, []);

  return (
    <>
      <RadioGroup
        className="relative mx-9 flex justify-between gap-4 mb-10"
        onValueChange={(value) => {
          setPayType(value);
        }}
        defaultValue={String(payType)}
      >
        {paysType
          .filter((item) => (item.isTG ? AppConfigEnv.isTG : true))
          .map((item) => {
            return (
              <div
                key={item.label}
                className={cn(
                  'px-4 py-3 rounded-xl flex-1 flex justify-start items-center border border-[#745efe] text-sm transition-all duration-300',
                  payType == item.payValue ? 'bg-[#745efe]' : ''
                )}
              >
                <RadioGroupItem
                  className="w-5 h-5 relative rounded-full border border-[#d1d1d1] mr-1 appearance-none outline-none bg-white data-[state=checked]:bg-transparent data-[state=checked]:border-transparent"
                  value={item.payValue}
                  id={item.label}
                >
                  <FaCheck></FaCheck>
                </RadioGroupItem>
                <label className="flex-1 text-left" htmlFor={item.label}>
                  {item.label}
                </label>
              </div>
            );
          })}
      </RadioGroup>

      {meals.map((meal: any, index) => (
        <div
          className="relative mx-9 mb-4"
          key={meal.id}
          onClick={() => {
            debounce(() => {
              onSubscribe(meal);
            });
          }}
        >
          <button
            className={cn(
              'font-bold cus-btn w-full',
              index !== 0 ? 'plain' : '',
              index === 0 ? 'flex justify-center items-center' : '',
              !meal.id ? 'transparent' : ''
            )}
            style={
              index === 0
                ? {
                    backgroundImage:
                      'linear-gradient(to right, #665ef2 0%, #8f54ee 100%)',
                  }
                : {}
            }
          >
            {payType !== '3' ? (
              <>
                {meal.originalPrice && (
                  <span className="mr-1 line-through">
                    {meal.originalPrice}
                  </span>
                )}
                {filterPrice(meal.price)}
              </>
            ) : (
              <>{filterPrice(meal.priceTon)} TON</>
            )}{' '}
            {filterUnit(meal.type)}
          </button>
          {index === 0 && meal.bubbleLabel && (
            <div className="absolute -top-5 -right-2">
              <Image
                width={128}
                height={40}
                src="/images/free-trail-bg.png"
                alt=""
              />
              <div className="absolute top-2 left-2/4 text-xs text-white whitespace-nowrap -translate-x-2/4">
                {meal.bubbleLabel}
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="text-white text-opacity-30">
        {t('createResult.cancelAnytime')}
      </div>
    </>
  );
};
