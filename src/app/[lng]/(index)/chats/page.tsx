'use client';
import { useTranslation } from '@/locales/client';
import './style.scss';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBusWatch } from '@/hooks/use-bus-watch';
import { fetchRequest } from '@/utils/request';
import { Empty } from '@/components/ExploresList';
import { filterCountTime, filterImage } from '@/utils/business';
import { useSystemStore } from '@/hooks/use-system';
import { AppConfigEnv } from '@/lib/utils';
import { AdultSwitch } from '@/components/AdultSwitch';

export default function ChatListPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { setData } = useSystemStore();
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [total, setTotal] = useState(0);
  const [list, setList] = useState<any[]>([]);

  const goToChat = (item: any) => {
    router.push(`chat?friendId=${item.id}`);
  };

  const getList = () => {
    if (loading) return;
    setLoading(true);
    const type = 'H5';
    fetchRequest(
      `/restApi/friend/list/v2?reviewVersion=${AppConfigEnv.APPVERSIONCODE}&type=${type}`,
      {
        pageSize: 100,
      }
    )
      .then(({ result }) => {
        setLoaded(true);
        const { conversations } = result;

        let unreadCount = 0;
        const _list: any[] = conversations.rows.map((item: any) => {
          unreadCount += item.unreadCount || 0;
          return item;
        });

        setList(_list);
        setTotal(_list.length);
        setData({
          unreadCount: unreadCount > 5 ? '···' : unreadCount,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };
  useBusWatch('enterInto', getList);

  useEffect(() => {
    getList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={'full-page tab-page chats'}>
      <div className="page__title">
        <div className="text-2xl font-bold text-white">
          {t('indexChats.title')}
        </div>
        <AdultSwitch></AdultSwitch>
      </div>
      <div className="page-container">
        <div className="container__list">
          {!total && loaded ? (
            <Empty
              reloadText={t('index.title')}
              text={t('indexChats.noChat')}
              subtext={t('indexChats.exploreOthers')}
              emptyImageKey="index-chats"
              reload={() => router.push('/')}
            />
          ) : (
            <div className="list__box">
              {list.map((item) => (
                <div
                  className="list-item"
                  key={item.id}
                  onClick={() => goToChat(item)}
                >
                  <div className={'item__left rtl:ml-3 rtl:!mr-0'}>
                    <div
                      className="item-head"
                      style={{
                        backgroundImage: `url(${filterImage(
                          item.animationHead || item.cover
                        )})`,
                      }}
                    ></div>
                    <div className="item-dot rtl:!right-[unset] rtl:left-[6px]"></div>
                  </div>
                  <div className="item__center">
                    <div className="item-name line-clamp-1">{item.name}</div>
                    <div className="item-word line-clamp-1">
                      {item.lastMessage}
                    </div>
                  </div>
                  <div className="item__right">
                    <div className="item-time">
                      {filterCountTime(item.lastMessageTimestamp, t)}
                    </div>
                    {Boolean(item.unreadCount) && (
                      <div className="item-new">
                        {item.unreadCount > 5 ? '···' : item.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
