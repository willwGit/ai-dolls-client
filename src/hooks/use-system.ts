import { AppConfigEnv } from '@/lib/utils';
import { fetchRequest } from '@/utils/request';
import Cookies from 'js-cookie';
import { create } from 'zustand';

type State = {
  isFull: boolean;
  unreadCount: number | string;
  linkMap: {
    [key: string]: string;
  };
  snShare: {
    [key: string]: string;
  };
  linkShare: {
    [key: string]: string;
  };
  slogans: {
    content: string;
    extension: any;
  }[];
  filterTags: any[];
};

export interface SystemStore {
  systemState: State;
  initSystemData: (data?: Partial<SystemStore['systemState']>) => void;
  setData: (data?: Partial<SystemStore['systemState']>) => void;
}

export const useSystemStore = create<SystemStore>()((set) => ({
  systemState: {
    isFull: false,
    unreadCount: 0,
    linkMap: {},
    linkShare: {
      en: '',
      ja: '',
      ar: '',
    },
    snShare: {
      en: '',
      ja: '',
      ar: '',
    },
    slogans: [],
    filterTags: [],
  },
  setData: (data) => {
    set(({ systemState }) => {
      return { systemState: { ...systemState, ...data } };
    });
  },
  initSystemData: async () => {
    console.log(AppConfigEnv.APPVERSIONCODE);

    fetchRequest('/restApi/versionLog/auth/getRenewInfo', {
      type: AppConfigEnv.APPTYPE,
      reviewVersion: AppConfigEnv.APPVERSIONCODE,
      apiVersion: 2,
    }).then(({ result }) => {
      set(({ systemState }) => ({
        systemState: { ...systemState, isFull: !result.isReview },
      }));
    });
    fetchRequest('/restApi/setting/auth/detailByName', { name: 'LINKS' }).then(
      ({ result }) => {
        set(({ systemState }) => ({
          systemState: {
            ...systemState,
            linkMap: JSON.parse(result.value || '{}'),
          },
        }));
      }
    );

    fetchRequest('/restApi/setting/auth/detailByName', {
      name: 'FILTETR_TAGS',
    }).then(({ result }) => {
      set(({ systemState }) => ({
        systemState: {
          ...systemState,
          filterTags: JSON.parse(result.value || '[]'),
        },
      }));
    });

    fetchRequest('/restApi/setting/auth/detailByName', {
      name: 'SHARE_COPY',
    }).then(({ result }) => {
      set(({ systemState }) => {
        const { snShare } = systemState;
        const _snShare: typeof snShare = {};
        const obj = JSON.parse(result.value || '{}');
        Object.keys(snShare).map((k) => {
          _snShare[k] = obj[`sn-${k}`] || '';
        });

        return {
          systemState: {
            ...systemState,
            snShare: _snShare,
          },
        };
      });
    });

    fetchRequest('/restApi/banner/auth/list', {
      location: 'SLOGAN',
      size: 100,
      sort: 'ASC',
      orderBy: 'sort',
    }).then(({ result }) => {
      set(({ systemState }) => ({
        systemState: {
          ...systemState,
          slogans: (result?.rows || []).map((item: any) => ({
            content: item.content,
            extension: JSON.parse(item.extension || '{}'),
          })),
        },
      }));
    });

    if (Cookies.get('token')) {
      fetchRequest(
        `/restApi/friend/list/v2?reviewVersion=${AppConfigEnv.APPVERSIONCODE}&type=${AppConfigEnv.APPTYPE}`,
        { limit: 100 }
      ).then(({ result }) => {
        const { conversations } = result;
        const unreadCount = conversations?.rows?.reduce(
          (prev: any, cur: any) => prev + cur.unreadCount || 0,
          0
        );
        set(({ systemState }) => ({
          systemState: {
            ...systemState,
            unreadCount: unreadCount > 5 ? '···' : unreadCount,
          },
        }));
      });
    }
  },
}));
