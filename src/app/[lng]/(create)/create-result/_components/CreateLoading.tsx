import { FC } from 'react';

export const CreateLoading: FC<{
  progressNum: number;
}> = ({ progressNum }) => {
  return (
    <div
      className="absolute left-0 top-0 w-full h-full bg-[rgb(24, 20, 37)] bg-opacity-50 backdrop-filter"
      style={{
        backdropFilter: `blur(${((100 - progressNum) / 100) * 50}px)`,
      }}
    >
      <div className="absolute bottom-20 left-0 w-full">
        <div className="mb-3 text-white text-opacity-30 text-lg text-center">
          {progressNum}%
        </div>
        <div className="mx-auto w-10/12 h-3 bg-white bg-opacity-30 rounded-2xl">
          <div
            className="h-full rounded-2xl transition-all duration-300"
            style={{
              width: `${progressNum}%`,
              backgroundImage:
                'linear-gradient(to right, #7e78e4 0%, #9e6ed1 100%)',
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};
