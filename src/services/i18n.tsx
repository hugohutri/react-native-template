import { ReactNode } from 'react';
import { getLocales } from 'react-native-localize';
import { Settings } from 'luxon';
import { en, fi } from 'make-plural';
import { i18n } from '@lingui/core';
import { I18nProvider as LinguiProvider, useLingui } from '@lingui/react';

import { useEvent } from '~utils/common';
import storage from '~utils/storage';

export type Locale = 'fi' | 'en';

const LOCALES: Locale[] = ['fi', 'en'];

export async function initMessages() {
  const locales = getLocales();
  const persistedLocale = storage.getString('@app/locale');
  const preferredLocale = locales[0];

  const defaultLocale = (
    LOCALES.some((l) => l === persistedLocale)
      ? persistedLocale
      : LOCALES.includes(preferredLocale.languageCode as Locale)
      ? preferredLocale.languageCode
      : 'en'
  ) as Locale;

  const defaultMessages =
    defaultLocale === 'fi'
      ? require('../locales/fi/messages').messages
      : require('../locales/en/messages').messages;

  Settings.defaultLocale = defaultLocale;
  i18n.loadLocaleData({ en: { plurals: en }, fi: { plurals: fi } });
  i18n.load(defaultLocale, defaultMessages);
  i18n.activate(defaultLocale);
}

async function loadMessages(locale: Locale) {
  switch (locale) {
    case 'fi':
      return require('../locales/fi/messages').messages;
    case 'en':
      return require('../locales/en/messages').messages;
    default:
      throw Error(`Unkown locale: ${locale}`);
  }
}

export function useI18n() {
  const lingui = useLingui();
  const currentLocale = lingui.i18n.locale as Locale;

  const setLocale = useEvent(async (locale: Locale) => {
    try {
      const newMessages = await loadMessages(locale);

      Settings.defaultLocale = locale;
      lingui.i18n.load(locale, newMessages);
      lingui.i18n.activate(locale);

      storage.set('@app/locale', locale);
    } catch (error) {
      console.log(`> Failed to load messages for locale: ${locale}`, error);
    }
  });

  const toggleLocale = useEvent(() => {
    setLocale(currentLocale === 'fi' ? 'en' : 'fi');
  });

  return {
    i18n: lingui.i18n,
    locale: currentLocale,
    setLocale,
    toggleLocale,
  };
}

export function I18nProvider({ children }: { children: ReactNode }) {
  return <LinguiProvider i18n={i18n}>{children}</LinguiProvider>;
}
