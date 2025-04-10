'use client';
import meta from '../app/[lng]/meta';
import { useTranslation } from '@/locales/client';
import { Lng, languages } from '@/locales/i18n';
import { FaChevronLeft } from 'react-icons/fa';
import { usePathname, useRouter } from 'next/navigation';
import { FC, useEffect, useState } from 'react';

export const Navbar: FC<{
  children?: React.ReactNode;
  title?: string;
  back?: () => void;
}> = ({ children, title, back }) => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  // path 路径携带 / 开头
  const path = usePathname();
  const pathArr = path.split('/');
  pathArr.splice(pathArr.length - 1, 1);

  const metadata = languages.includes(path.replace('/', '') as Lng)
    ? meta['/']
    : meta[path.replace('/' + i18n.language, '')] || {};

  const [navTitle, setNavTitle] = useState('');

  useEffect(() => {
    setNavTitle(metadata.locale ? t(metadata.locale) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return (
    <>
      {metadata.hidden && !children ? (
        ''
      ) : (
        <div
          className={`px-4 w-full${
            metadata.isPlaceholder != false ? '' : ' fixed z-10 bg-[#181425]'
          }`}
        >
          <div className={`flex items-center rounded-lg bg-base-300 h-12 `}>
            <div
              onClick={() => {
                if (back && typeof back === 'function') {
                  back();
                } else {
                  router.back();
                }
              }}
            >
              <div className="flex-none leading-none">
                <FaChevronLeft className=" size-6 svg-icon swap-off text-white rtl:rotate-180" />
              </div>
            </div>

            <div className="flex-1 text-center">
              <span className="font-sans _bold text-base-content pl-2 text-xl normal-case text-white">
                {title || navTitle}
              </span>
            </div>
            <div className="flex-none">{children}</div>
          </div>
        </div>
      )}
    </>
  );
};
