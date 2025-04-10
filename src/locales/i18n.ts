import { createInstance, i18n } from 'i18next';
import { initReactI18next } from 'react-i18next/initReactI18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import ar from '../../public/locales/ar.json';
import en from '../../public/locales/en.json';
import ja from '../../public/locales/ja.json';
import { getOptions, DEFAULT_NS } from './settings';
import { AppConfigEnv } from '@/lib/utils';

let cacheI18n: i18n;

export type Resources = {
  [key in keyof typeof resources]: (typeof resources)[key] & {
    [DEFAULT_NS]: Indexes;
  };
};
export type Lng = keyof typeof resources;

export const FALLBACK_LNG = AppConfigEnv.LNG as Lng;
export const resources = {
  ja: { [DEFAULT_NS]: ja },
  en: { [DEFAULT_NS]: en },
  ar: { [DEFAULT_NS]: ar },
};
export const languages = Object.keys(resources) as Lng[];

const initI18next = async (lng: Lng, ns: string = DEFAULT_NS) => {
  const i18nInstance = createInstance();
  await i18nInstance
    .use(initReactI18next)
    .use(resourcesToBackend(resources))
    .init(getOptions(lng, ns));
  return i18nInstance;
};

export async function useTranslation(lng: Lng, options = { keyPrefix: '' }) {
  const i18nextInstance = cacheI18n ? cacheI18n : await initI18next(lng);
  if (!cacheI18n) {
    cacheI18n = i18nextInstance;
  }

  return {
    t: i18nextInstance.getFixedT(lng, options?.keyPrefix || ''),
    i18n: i18nextInstance,
  };
}
