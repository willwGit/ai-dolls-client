import { fetchRequest } from '@/utils/request';
import { create } from 'zustand';
import { useCountDownStore } from './use-count-down';
import { logout } from '@/utils/business';
import Cookies from 'js-cookie';

const state = {
  id: '',
  head: '',
  nickName: '',
  adultSwitch: '',
  premiumStatus: 'NONE',
  interests: [],
  createdTime: '',
  tonAddress: '',
  premiumEndTime: '',
  hasRejectFriendStyle: '',
  playVideoCount: '',
  sex: '',
  playAllowWatchVideoCount: '',
  notPremiumSentMessageCount: '',
  hasEnterNewChatPage: '',
  hasComment: '',
  inviteMemberId: '',
  inviteCode: '',
};

export interface UserStore {
  userState: typeof state;
  clearUser: () => void;
  setDataLocal: (data?: Partial<UserStore['userState']>) => void;
  setData: () => Promise<UserStore['userState']>;
}

export const useUserStore = create<UserStore>()((set) => ({
  userState: {
    ...state,
  },
  clearUser() {
    set(({ userState }) => {
      return {
        userState: {
          ...state,
        },
      };
    });
  },
  setDataLocal(data) {
    set(({ userState }) => {
      return { userState: { ...userState, ...data } };
    });
  },
  setData: () => {
    /**
     * 请求用户信息
     */
    return new Promise((resolve, reject) => {
      fetchRequest('/restApi/member/info')
        .then((res) => {
          console.log(res);

          if (res.code === 401) {
            reject();
            return;
          }

          set(({ userState }) => {
            return { userState: { ...userState, ...res.result } };
          });

          if (res.result.premiumStatus === 'ACTIVITY_EXPERIENCE') {
            useCountDownStore
              .getState()
              .startCountDown(res.result.premiumEndTime)
              .then((isEnd) => {
                if (isEnd) {
                  res.result.premiumStatus = 'NONE';
                }
                console.log('setUserInfo resolve');
                resolve(res.result);
              });
          } else {
            resolve(res.result);
          }
        })
        .catch((err) => {
          console.log(err);
          reject();
        });
    });
  },
}));
