import { cn } from '@/lib/utils';
import { FC } from 'react';
import { STEP } from './Step';

export const ProgressBar: FC<{
  visible: boolean;
  step: STEP;
}> = ({ visible, step }) => {
  const steps = [STEP.NAME, STEP.INTERESTS, STEP.GIRL_STYLE, STEP.GIRL_NAME];
  return (
    visible && (
      <div className="flex justify-center mt-2">
        {steps.map((item, index) => (
          <div
            key={index}
            className={cn(
              'w-2 h-2 rounded-full bg-white bg-opacity-30 ml-4 first-of-type:ml-0',
              steps.indexOf(step) + 1 > index ? 'bg-opacity-100' : '',
              'rtl:!ml-0 rtl:mr-4'
            )}
          ></div>
        ))}
      </div>
    )
  );
};
