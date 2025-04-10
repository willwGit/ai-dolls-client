import { create } from 'zustand';
import { useUserStore } from './use-user';

type State = {
  now: string | number;
  nowTime: null | NodeJS.Timeout;
  premiumEndTime: null | string;
  isEnd: boolean;
  diffTime: string[];
};

const pad = (number: number, length: number) => {
  let str = `${number}`; // 转换成字符串
  while (str.length < length) {
    str = `0${str}`; // 前面补零
  }
  return str;
};

interface CountDownStore {
  countDownState: State;
  clearTime: () => void;
  START_COUNT_DOWN: () => void;
  startCountDown: (premiumEndTime: string) => Promise<boolean>;
  setData: (data: CountDownStore['countDownState']) => void;
}

export const useCountDownStore = create<CountDownStore>()((set) => ({
  countDownState: {
    now: '',
    nowTime: null,
    premiumEndTime: null,
    isEnd: false,
    diffTime: ['--', '--', '--'],
  },
  START_COUNT_DOWN: () => {
    set(({ countDownState }) => {
      const _copyState = {
        ...countDownState,
      };
      const now = new Date();
      // 获取本地时间的UTC时间部分
      const utcDate = new Date(
        `${now.getUTCFullYear()}/${
          now.getUTCMonth() + 1
        }/${now.getUTCDate()} ${now.getUTCHours()}:${now.getUTCMinutes()}:${now.getUTCSeconds()}`
      );
      _copyState.now = utcDate.getTime();
      // 获取目标时间的时间戳
      const target = Number(new Date(_copyState.premiumEndTime!));

      // 计算时间差（单位为毫秒）
      let diff = target - _copyState.now;
      // 判断时间差是否为负数，如果是，表示目标时间已经过去
      if (diff < 0) {
        _copyState.isEnd = true;
        diff = Math.abs(diff); // 取绝对值
      } else {
        _copyState.isEnd = false;
      }

      // 计算相差的小时数、分钟数和秒数
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (seconds <= 0) {
        useUserStore.getState().setData();
      }

      if (hours <= 0 && minutes <= 0 && seconds <= 0) {
        if (_copyState.nowTime) clearInterval(_copyState.nowTime);

        _copyState.isEnd = true;
        useUserStore.getState().setDataLocal({
          premiumStatus: 'NONE',
        });

        if (window.location.pathname !== '/create-result') {
          window.location.href = '/create-result?source=open_app';
        }
      }
      // 返回结果数组
      _copyState.diffTime = [
        pad(hours || 0, 2),
        pad(minutes || 0, 2),
        pad(seconds || 0, 2),
      ];

      return { countDownState: { ..._copyState } };
    });
  },
  /**
   * 领取短暂 VIP 后开始倒计时
   */
  startCountDown(premiumEndTime) {
    return new Promise((resolve) => {
      set(({ countDownState, START_COUNT_DOWN }) => {
        if (countDownState.nowTime) clearInterval(countDownState.nowTime);

        if (!premiumEndTime) {
          resolve(false);
          return { countDownState: { ...countDownState } };
        }

        const _premiumEndTime = premiumEndTime;
        START_COUNT_DOWN();

        const _nowTime = setInterval(() => {
          START_COUNT_DOWN();
        }, 1000);
        setTimeout(() => {
          resolve(countDownState.isEnd);
        });

        return {
          countDownState: {
            ...countDownState,
            premiumEndTime: _premiumEndTime,
            nowTime: _nowTime,
          },
        };
      });
    });
  },
  /**
   * 清除我的页面定时器
   */
  clearTime: () =>
    set((state) => {
      if (state.countDownState.nowTime)
        clearInterval(state.countDownState.nowTime);
      return { countDownState: { ...state.countDownState } };
    }),
  setData: (data) =>
    set(() => {
      return { countDownState: { ...data } };
    }),
}));
