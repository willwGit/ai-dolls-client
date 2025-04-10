'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { TFunction } from 'i18next';
import Image from 'next/image';
import ImageCropper from '@/components/ImageCropper';
import { filterImage } from '@/utils/business';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchRequest } from '@/utils/request';
import { Button } from '@/components/Button';
import { toast } from 'sonner';

export type StepContextType = {
  form: {
    cover: string;
    name: string;
    id?: string;
    visibility: string;
    description: string;
    extDescription: string;
    greeting: string;
    characterRaw: string;
    [s: string]: string | undefined;
  };
  _form: StepContextType['form'];
  setForm: (val: StepContextType['form']) => void;
  t: TFunction<'translation', undefined>;
  hasDoNext: boolean;
  personalityGroup: any[];
  setPersonalityGroup: React.Dispatch<
    React.SetStateAction<StepContextType['personalityGroup']>
  >;
  occupationExtIdx: number | '';
  setOccupationExtIdx: React.Dispatch<
    React.SetStateAction<StepContextType['occupationExtIdx']>
  >;
  occupationExtItems: any[];
};
export const StepContext = createContext<Partial<StepContextType>>({});

export const BaseStep = () => {
  const ctx = useContext(StepContext);

  const setVisibility = () => {
    ctx?.setForm?.({
      ...ctx.form!,
      visibility: ctx.form?.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC',
    });
  };

  const updateForm = (field: string, value: string) => {
    ctx?.setForm?.({
      ...ctx._form!,
      [field]: value,
    });
  };

  return (
    <div className="tag">
      <div className="title-lg flex items-center text-xl font-bold text-white mb-5">
        {ctx.t!('userCreate.addAvatar')}
      </div>
      <div className="tab__upload relative flex justify-center items-center mx-auto mb-10 w-24 h-24 rounded-xl bg-[#332f40]">
        {ctx.form?.cover ? (
          <Image
            width={96}
            height={96}
            className="head rounded-xl"
            src={filterImage(ctx.form.cover)}
            alt="avatar"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="icon size-5"
            src="/icons/photograph-plain.png"
            alt="upload"
          />
        )}
        <ImageCropper
          setHead={(url) =>
            ctx?.setForm?.({
              ...ctx._form!,
              cover: url,
            })
          }
        />
      </div>

      <div className="title-lg flex items-center text-xl font-bold text-white mb-3">
        {ctx.t!('userCreate.pickName')}
      </div>
      <div className="tab__input relative mb-10">
        <div
          className={`input__inner box-border pr-16 pl-4 w-full h-16 rounded-xl bg-[#332f40] text-lg text-white rtl:pr-4 rtl:pl-16`}
        >
          <input
            className={`bg-transparent size-full ${
              (ctx.form?.name.length || 0) > 15 ? 'warning text-[#ff4c4e]' : ''
            }`}
            type="text"
            value={ctx.form?.name}
            onChange={(e) => updateForm('name', e.target.value)}
            maxLength={15}
          />
        </div>
        <div className="inner__tag absolute top-2/4 right-4 -translate-y-2/4 text-sm text-[#625e6f] rtl:left-4 rtl:!right-[unset]">
          <span
            className={`${
              (ctx.form?.name.length || 0) > 15 ? 'warning text-[#ff4c4e]' : ''
            }`}
          >
            {ctx.form?.name.length}
          </span>
          /15
        </div>
        {ctx.hasDoNext && !ctx.form?.name && (
          <div className="inner__err absolute left-0 text-[#ff4c4e] text-sm leading-none translate-y-2">
            {ctx.t!('userCreate.canNotEmpty')}
          </div>
        )}
      </div>

      <div
        className="title-lg flex items-center text-xl font-bold text-white mb-3"
        onClick={setVisibility}
      >
        {ctx.t!('userCreate.setPrivacy')}
        <Image
          className="icon mx-3"
          width={20}
          height={20}
          src={
            ctx.form?.visibility === 'PUBLIC'
              ? '/icons/unSelected.png'
              : '/icons/selected.png'
          }
          alt="visibility"
        />
      </div>
      <div className="tab__tip mt-2 mb-8 text-[#a19ea9]">
        {ctx.form?.visibility === 'PUBLIC'
          ? ctx.t!('userCreate.anyoneCanSee')
          : ctx.t!('userCreate.onlyYouCanSee')}
      </div>

      <div className="title-lg flex items-center text-xl font-bold text-white mb-3">
        {ctx.t!('userCreate.subtitle')}
      </div>
      <div className="tab__tip mt-2 text-[#a19ea9]">
        {ctx.t!('userCreate.subtitleTip')}
      </div>
      <div className="tab__input relative mt-5">
        <textarea
          className={`textarea__inner box-border resize-none p-4 pb-8 w-full h-40 rounded-xl bg-[#332f40] text-lg text-white placeholder:text-[#625e6f] ${
            (ctx.form?.description.length || 0) > 60
              ? 'warning text-[#ff4c4e]'
              : ''
          }`}
          value={ctx.form?.description}
          onChange={(e) => updateForm('description', e.target.value)}
          placeholder={ctx.t!('userCreate.subtitlePlaceholder')}
          maxLength={60}
        ></textarea>
        <div className="inner__tag textarea flex items-end top-[unset] bottom-4 absolute right-4 text-sm text-[#625e6f] rtl:left-4 rtl:!right-[unset]">
          <span
            className={`${
              (ctx.form?.description.length || 0) > 60
                ? 'warning text-[#ff4c4e]'
                : ''
            }`}
          >
            {ctx.form?.description.length}
          </span>
          /60
        </div>
        {ctx.hasDoNext &&
          !ctx.form?.description &&
          ctx.form?.visibility === 'PUBLIC' && (
            <div className="inner__err absolute left-0 text-[#ff4c4e] text-sm leading-none translate-y-1">
              {ctx.t!('userCreate.canNotEmpty')}
            </div>
          )}
      </div>
    </div>
  );
};

export const PersonalityStep = () => {
  const {
    personalityGroup,
    setPersonalityGroup,
    t,
    form,
    _form,
    setForm,
    occupationExtIdx,
    setOccupationExtIdx,
    occupationExtItems,
  } = useContext(StepContext);
  const [textareaFocus, setTextareaFocus] = useState(false);
  const [selectValue, setSelectValue] = useState(
    String(occupationExtIdx) || ''
  );

  const selectOption = (item: any, index: number, traitId: string) => {
    const _item = { ...item };
    if (_item.type === 'SINGLE') {
      if (_item.label === 'Occupation') {
        setOccupationExtIdx?.('');
      }
      _item.selected = traitId;
    } else {
      const idx = _item.selected.findIndex(
        (selectItem: any) => selectItem === traitId
      );
      if (idx === -1) {
        _item.selected.push(traitId);
      } else {
        _item.selected.splice(idx, 1);
      }
    }

    const CopyState = [...(personalityGroup || [])];
    const nextItem = CopyState?.[index + 1];
    if (nextItem) nextItem.folding = false;
    CopyState[index] = _item;
    setPersonalityGroup?.(CopyState);
  };

  const onOccupationExtIdxChange = (value: string) => {
    setOccupationExtIdx?.(Number(value));
    const occupationData = personalityGroup?.find(
      (item: any) => item.label === 'Occupation'
    );
    if (occupationData) occupationData.selected = '';
  };

  return (
    <div className="tab">
      <div className="title-lg flex items-center text-xl font-bold text-white mb-8">
        {t!('userCreate.chooseTraits')}
      </div>
      {personalityGroup?.map((item: any, index: number) => (
        <div
          className={`tab__traits mb-5 border-b-2 border-b-[#252331] ${
            item.folding ? 'folding group' : ''
          }`}
          key={index}
        >
          <div
            className={`trait__label flex justify-between items-center mb-5 font-bold text-white transition-all duration-300`}
            onClick={() => {
              const CopyState = [...personalityGroup];
              if (index !== -1) {
                CopyState[index].folding = !personalityGroup[index].folding;
              }
              setPersonalityGroup?.(CopyState);
            }}
          >
            {item.label}
            <Image
              className="title__icon group-[.folding]:rotate-180 transition-all duration-200"
              width={14}
              height={14}
              src="/icons/top.png"
              alt="top"
            />
          </div>
          <div className="trait__values group-[.folding]:max-h-0 flex flex-wrap max-h-96 overflow-hidden transition-all duration-300">
            {item.values.map((trait: any) => (
              <div
                className={`value flex items-center justify-center m-0 mr-3 mb-3 py-2 px-3 min-w-16 bg-[#332f40] rounded-md ${
                  item.type === 'SINGLE'
                    ? trait.id === item.selected
                      ? 'active bg-gradient-to-r to-[#665ef2] from-[#8f54ee]'
                      : ''
                    : item.selected.includes(trait.id)
                    ? 'active bg-gradient-to-r to-[#665ef2] from-[#8f54ee]'
                    : ''
                }`}
                key={trait.id}
                onClick={() => selectOption(item, index, trait.id)}
              >
                {trait.option}
              </div>
            ))}
            {item.label === 'Occupation' && (
              <Select
                value={selectValue}
                onValueChange={(value) => {
                  setSelectValue(value);
                  onOccupationExtIdxChange(value);
                }}
              >
                <SelectTrigger
                  className={`min-w-16 bg-[#332f40] !outline-none border-none !shadow-none !ring-offset-0 w-[unset] m-0 mr-3 mb-3  ${
                    selectValue
                      ? 'bg-gradient-to-r to-[#665ef2] from-[#8f54ee]'
                      : ''
                  }`}
                >
                  <SelectValue placeholder="..." />
                </SelectTrigger>
                <SelectContent className="bg-[#332f40] border-none text-white h-60">
                  <SelectGroup>
                    {occupationExtItems?.map((option: any, i: number) => (
                      <SelectItem
                        key={option.id}
                        value={String(i)}
                        className={` hover:text-white active:text-white focus:text-white focus:bg-gradient-to-r focus:to-[#665ef2] focus:from-[#8f54ee]`}
                      >
                        {option.option}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      ))}
      <div className="tab__title mb-4 relative text-xl font-bold text-white">
        {t!('userCreate.extraDescription')}
      </div>
      <div className="tab__input relative">
        <textarea
          className={`textarea__inner no-placeholder box-border p-4 pb-8 w-full h-40 rounded-xl resize-none bg-[#332f40] text-lg text-white ${
            (form?.extDescription.length || 0) > 500
              ? 'warning text-[#ff4c4e]'
              : ''
          }`}
          value={form?.extDescription}
          onChange={(e) =>
            setForm?.({
              ..._form!,
              extDescription: e.target.value,
            })
          }
          maxLength={500}
          onFocus={() => setTextareaFocus(true)}
          onBlur={() => setTextareaFocus(false)}
        ></textarea>
        <div className="inner__tag textarea flex items-end absolute bottom-4 right-4 text-sm text-[#62536f] rtl:left-4 rtl:!right-[unset]">
          {form?.extDescription.length}/500
        </div>
        {!textareaFocus && !form?.extDescription && (
          <div className="inner__tip pointer-events-none absolute left-4 top-5 flex items-center text-lg text-[#625e6f]">
            {t!('userCreate.sheIs') + '...'}
            <Image
              className="icon ml-2"
              width={20}
              height={20}
              alt="pen"
              src="/icons/pen.png"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export const GreetingStep = () => {
  const { t, form, _form, setForm } = useContext(StepContext);
  const [textareaFocus, setTextareaFocus] = useState(false);
  const [generaLoading, setGeneraLoading] = useState(false);
  const getAIGeneration = () => {
    setGeneraLoading(true);
    const { name, extDescription, characterRaw } = form!;
    fetchRequest('/restApi/friendStyle/getUGCGreeting', {
      name,
      extDescription,
      characterRaw,
    }).then((res) => {
      if (typeof res.result === 'string') {
        setForm?.({
          ..._form!,
          greeting: res.result.slice(0, 120),
        });
      } else {
        toast('AI generation failure');
      }

      setGeneraLoading(false);
    });
  };

  return (
    <div className="tab">
      <div className="title-lg flex items-center text-xl font-bold text-white mb-3">
        {t!('userCreate.firstMessage')}
      </div>
      <div className="tab__tip mt-2 text-[#a19ea9]">
        {t!('userCreate.firstMessageTip')}
      </div>
      <div className="tab__input relative mt-5">
        <textarea
          className={`textarea__inner no-placeholder box-border p-4 pb-10 w-full h-44 rounded-xl resize-none bg-[#332f40] text-lg text-white ${
            (form?.greeting.length || 0) > 120 ? 'warning text-[#ff4c4e]' : ''
          }`}
          value={form?.greeting}
          onChange={({ target }) => {
            setForm?.({
              ..._form!,
              greeting: target.value,
            });
          }}
          maxLength={120}
          onFocus={() => setTextareaFocus(true)}
          onBlur={() => setTextareaFocus(false)}
        ></textarea>
        <div className="inner__tag textarea flex items-end absolute bottom-4 right-4 text-sm text-[#62536f]">
          <span
            className={
              (form?.greeting?.length || 0) > 120
                ? 'warning text-[#ff4c4e]'
                : ''
            }
          >
            {form?.greeting.length}
          </span>
          /120
          <div
            className="clear-btn ml-2 flex items-center justify-center w-7 h-7 rounded-md bg-[#413b5d]"
            onClick={() => {
              setForm?.({
                ..._form!,
                greeting: '',
              });
            }}
          >
            <Image
              className="icon"
              width={14}
              height={14}
              alt=""
              src="/icons/close-primary.png"
            />
          </div>
        </div>
        {!textareaFocus && !form?.greeting && (
          <div className="inner__tip pointer-events-none absolute left-4 top-5 flex items-center text-lg text-[#625e6f]">
            {t!('userCreate.HiIAm') + '...'}
            <Image
              className="icon"
              width={20}
              height={20}
              alt=""
              src="/icons/pen.png"
            />
          </div>
        )}
        <Button
          title={t!('userCreate.AIGeneration')}
          disabled={generaLoading}
          className="inner__ai absolute !h-auto !w-auto font-normal bottom-4 left-4 px-2 py-1 rounded-md text-[#8f7ecc] !text-sm !mb-0 bg-[#413b5d]"
          click={getAIGeneration}
        ></Button>
        {form?.greeting.length === 0 && (
          <div className="inner__err absolute left-0 text-[#ff4c4e] text-sm leading-none translate-y-1">
            {t!('userCreate.canNotEmpty')}
          </div>
        )}
      </div>
    </div>
  );
};
