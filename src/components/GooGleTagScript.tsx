'use client';

import AppConfigEnv from '@/lib/utils';
import { useEffect, useState } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';

export const GoogleTagScript = () => {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
  }, []);

  return (
    <>
      {loading && (
        <GoogleAnalytics gaId={AppConfigEnv.GOOGLE_GAID}></GoogleAnalytics>
      )}
    </>
  );
};
