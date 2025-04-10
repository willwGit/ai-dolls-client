/* eslint-disable @next/next/no-img-element */
'use client';

import { FaCheck } from 'react-icons/fa6';
import { UserStore } from '@/hooks/use-user';
import { cn } from '@/lib/utils';
import { filterImage } from '@/utils/business';
import React, {
  Dispatch,
  FC,
  SetStateAction,
  createContext,
  useContext,
} from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

export enum STEP {
  NAME = 'name',
  INTERESTS = 'interests',
  GIRL_STYLE = 'girl_style',
  GIRL_NAME = 'girl_name',
  GENDER = 'gender',
}

export type FormData = {
  nickName: string;
  name: string;
  interests: never[];
  styleId: string;
  isExperiencePlot: boolean;
  faceId: string;
  sex: number | string;
};

export type StylesData = {
  label: string;
  id: string;
  name: string;
  cover: string;
};

export const StepContext = createContext<
  Partial<{
    setting: boolean;
    focus: boolean;
    loading: boolean;
    fromExplore: boolean;
    interests: never[];
    styles: StylesData[];
    stepTitleMap: Indexes;
    btnDisabled: boolean;
    styleByName: string;
    form: FormData;
    setForm: Dispatch<SetStateAction<FormData>>;
    onTabBtn: (val: STEP) => void;
    userState: UserStore['userState'];
  }>
>({});

export const Step1: FC<{
  setFocus: Dispatch<SetStateAction<boolean>>;
}> = ({ setFocus }) => {
  const state = useContext(StepContext);
  const { t } = useTranslation();

  return (
    <div className="px-6 pt-24">
      <div className="mb-20 text-center text-white text-3xl font-bold">
        {state.stepTitleMap?.[STEP.NAME]}
      </div>
      <input
        className="pb-4 outline-none w-full h-9 box-content border-b-2 border-white border-opacity-10 text-xl text-center bg-transparent"
        type="text"
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        value={state.form?.nickName}
        maxLength={15}
        placeholder={
          state.focus
            ? ''
            : state.userState?.nickName || t('createOptions.Jack')
        }
        onChange={({ target: { value } }) =>
          state.setForm?.((state) => ({
            ...state,
            nickName: value,
          }))
        }
      />
      <button
        className="cus-btn mt-14 p-1 py-4 text-xl font-bold w-full leading-[2.5]"
        disabled={state.btnDisabled}
        onClick={() => state.onTabBtn?.(STEP.INTERESTS)}
      >
        {t('createOptions.next')}
      </button>
    </div>
  );
};

export const Step2: FC<{
  setInterestIds: (id: never) => void;
}> = ({ setInterestIds }) => {
  const state = useContext(StepContext);
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden flex flex-col flex-1">
      <div className="px-6 pt-6 pb-8 text-3xl font-bold">
        {state.stepTitleMap?.[STEP.INTERESTS]}
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 flex flex-wrap text-lg leading-5">
          {state.interests?.map((item: any) => (
            <div
              key={item.id}
              className="mx-2 mb-4 p-3 rounded-xl"
              style={{
                background: state.form?.interests.includes(item.id as never)
                  ? 'linear-gradient(90deg,#665ef2 0,#8f54ee)'
                  : '#413b5d',
              }}
              onClick={() => setInterestIds(item.id as never)}
            >
              {item.contant}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 pb-5">
        <button
          className="cus-btn text-xl font-bold w-full leading-[2.5]"
          disabled={state.btnDisabled}
          onClick={() => state.onTabBtn?.(STEP.GIRL_STYLE)}
        >
          {state.setting ? t('createOptions.accept') : t('createOptions.next')}
        </button>
      </div>
    </div>
  );
};

export const Step3: FC<{
  setStyleId: (id: string, name: string) => void;
}> = ({ setStyleId }) => {
  const state = useContext(StepContext);
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden flex flex-col flex-1 max-h-full">
      <div className="px-6 pt-6 pb-8 text-3xl font-bold pr-0 rtl:!pl-0 rtl:!pr-5">
        {state.stepTitleMap?.[STEP.GIRL_STYLE]}
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 text-lg leading-5 grid grid-cols-3 gap-x-3 gap-y-14">
          {state.styles?.map((item) => (
            <div
              key={item.id}
              className="relative"
              onClick={() => setStyleId(item.id, item.name)}
            >
              {item.id == 'none' ? (
                // Coming soon
                <>
                  <img
                    className="w-full h-40 rounded-xl"
                    src="/images/add-bg.png"
                    alt="Coming soon"
                  />
                  <div className="absolute top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 text-center text-lg font-bold *:bg-clip-text">
                    <div style={Step3TextColor}>Coming</div>
                    <div style={Step3TextColor}>soon</div>
                  </div>
                </>
              ) : (
                <>
                  <img
                    className="w-full h-40 rounded-xl"
                    src={filterImage(item.cover, '300')}
                    alt={item.label}
                  ></img>
                  <div
                    className={cn(
                      'border-2 border-[#745efe] absolute left-0 top-0 w-full h-full rounded-xl overflow-hidden transition-all duration-300',
                      state.form?.styleId === item.id
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  >
                    <div
                      dir="ltr"
                      className="absolute right-0 bottom-0 translate-x-2/4 translate-y-2/4 w-10 h-10 bg-[#745efe] rounded-full p-[6px]"
                    >
                      <FaCheck className="text-xs" />
                    </div>
                  </div>

                  <div className="absolute -bottom-2 left-2/4 -translate-x-2/4 translate-y-full text-base whitespace-nowrap">
                    {item.label}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 pb-5">
        <button
          className="cus-btn text-xl font-bold w-full leading-[2.5]"
          disabled={state.btnDisabled}
          onClick={() => state.onTabBtn?.(STEP.GIRL_NAME)}
        >
          {state.setting ? t('createOptions.accept') : t('createOptions.next')}
        </button>
      </div>
    </div>
  );
};

export const StepGender: FC<{
  setSex: (num: number | string) => void;
  onCreate: () => void;
}> = ({ setSex, onCreate }) => {
  const state = useContext(StepContext);
  const { t } = useTranslation();

  const genders = [
    {
      icon: '/icons/male.png',
      value: 1,
      label: 'play.male',
    },
    {
      icon: '/icons/female.png',
      value: 2,
      label: 'play.female',
    },
    {
      icon: '/icons/non-binary.png',
      value: 0,
      label: 'play.nonBinary',
    },
  ];

  return (
    <div className="px-6 pt-24">
      <div className="mb-10 text-center text-white text-3xl font-bold">
        {state.stepTitleMap?.[STEP.GENDER]}
      </div>
      <div className="flex justify-between">
        {genders.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center w-[105px] h-[105px] rounded-xl"
            style={{
              background:
                state.form?.sex === item.value
                  ? 'linear-gradient(to right, #736bff 0%, #e254ee 100%)'
                  : '#332f40',
            }}
            onClick={() => {
              setSex(item.value);
            }}
          >
            <Image
              width={33}
              height={33}
              className="mt-5 mb-3"
              src={item.icon}
              alt=""
            />
            <span className="text-white">{t(item.label)}</span>
          </div>
        ))}
      </div>
      <button
        className="cus-btn mt-14 p-1 py-4 text-xl font-bold w-full leading-[2.5]"
        disabled={state.btnDisabled}
        onClick={() => state.onTabBtn?.(STEP.GIRL_STYLE)}
      >
        {t('createOptions.accept')}
      </button>
    </div>
  );
};

export const Step4: FC<{
  setFocus: Dispatch<SetStateAction<boolean>>;
  onCreate: () => void;
}> = ({ setFocus, onCreate }) => {
  const state = useContext(StepContext);
  const { t } = useTranslation();

  return (
    <div className="px-6 pt-24">
      <div className="mb-20 text-center text-white text-3xl font-bold">
        {state.stepTitleMap?.[STEP.GIRL_NAME]}
      </div>
      <input
        className="pb-4 outline-none w-full h-9 box-content border-b-2 border-white border-opacity-10 text-xl text-center bg-transparent"
        type="text"
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        value={state.form?.name}
        maxLength={15}
        placeholder={state.focus ? '' : state.styleByName}
        onChange={({ target: { value } }) =>
          state.setForm?.((state) => ({
            ...state,
            name: value,
          }))
        }
      />
      <button
        className="cus-btn mt-14 p-1 py-4 text-xl font-bold w-full leading-[2.5]"
        disabled={state.btnDisabled}
        onClick={onCreate}
      >
        {t('createOptions.continue')}
      </button>
    </div>
  );
};

const Step3TextColor = {
  backgroundImage: 'linear-gradient(90deg,#b1acff 0,#c971ff)',
  WebkitTextFillColor: 'transparent',
};
