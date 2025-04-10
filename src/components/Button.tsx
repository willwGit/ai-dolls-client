import { debounce } from '@/utils/debounce-throttle';
import { FC } from 'react';

export const Button: FC<{
  title: string;
  click: () => void;
  className?: string;
  disabled?: boolean;
  showLoading?: boolean;
}> = ({ title, click, className, disabled, showLoading }) => {
  return (
    <button
      className={`btn-loading h-14 w-full flex justify-center items-center mb-4 rounded-full font-bold ${className}`}
      onClick={() => {
        debounce(click);
      }}
      disabled={disabled || false}
    >
      {showLoading && <span className="loading loading-spinner"></span>}
      {title}
    </button>
  );
};
