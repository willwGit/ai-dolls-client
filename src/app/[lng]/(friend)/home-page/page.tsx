'use client';
import { Navbar } from '@/components/Navbar';
import { useTranslation } from '@/locales/client';
import { filterImage } from '@/utils/business';
import { fetchRequest } from '@/utils/request';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FC, TouchEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import emitter from '@/utils/bus';
import { CenterPopup } from '@/components/CenterPopup';
let id = '';
const state = {
  startY: 0,
  endY: 0,
  moveFlag: false,
};
export default function HomePage() {
  const [showMore, setShowMore] = useState(false);
  const [changeNickNameDialogVisible, setChangeNickNameDialogVisible] =
    useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [info, setInfo] = useState({
    character: '',
    name: '',
    head: '',
    styleType: '',
  });
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();

  const getDetail = () => {
    fetchRequest(`/restApi/friend/detail/${id}`).then((res) => {
      const { name, head, character, styleType } = res.result;
      setInfo({
        name,
        head,
        character,
        styleType,
      });
    });
  };

  const changeNickname = () => {
    if (!info.name) {
      toast(t('indexMine.nicknameCannotBeEmpty'));
      return;
    }
    fetchRequest('/restApi/friend/update', {
      id: id,
      name: info.name,
    }).then(() => {
      setChangeNickNameDialogVisible(false);
      emitter.emit('setName', info.name);
    });
  };

  const onDelete = () => {
    fetchRequest('/restApi/friend/delete', { id: id }).then(() => {
      toast(t('indexMine.successfullyDelete'));
      setTimeout(() => {
        router.push('/chats');
      }, 500);
    });
  };

  const touchstart = (e: TouchEvent<HTMLDivElement>, isAll?: 'all' | '') => {
    if (isAll && showMore) return;
    state.startY = e.touches[0].pageY;
    state.moveFlag = true;
  };
  const touchmove = (e: TouchEvent<HTMLDivElement>, isAll?: 'all' | '') => {
    if (isAll && showMore) return;
    state.endY = e.touches[0].pageY;
    if (state.moveFlag) {
      if (state.startY - state.endY > 45) {
        // 上滑
        setShowMore(true);
      }
      if (state.startY - state.endY < 45) {
        // 下滑
        setShowMore(false);
      }
    }
  };
  const touchend = () => {
    state.moveFlag = false;
  };

  useEffect(() => {
    id = searchParams.get('friendId')!;
    getDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="full-page bible-quote flex flex-col min-h-[unset]">
      <Navbar>
        <div className="nav__slot flex items-center">
          <div
            className="slot__item flex justify-center items-center w-8 h-8 rounded-md bg-[#332f40]"
            onClick={() => {
              router.push(`/albums?friendId=${id}&title=${info.name}`);
            }}
          >
            <Image
              alt=""
              width={20}
              height={20}
              className="icon"
              src="/icons/pic.png"
            />
          </div>
          <div
            className="slot__item flex justify-center items-center w-8 h-8 rounded-md bg-[#332f40] ml-3 rtl:!ml-0 rtl:mr-3"
            onClick={() => {
              setDeleteDialog(true);
            }}
          >
            <Image
              alt=""
              width={20}
              height={20}
              className="icon"
              src="/icons/trash.png"
            />
          </div>
        </div>
      </Navbar>
      <div className="w-full h-12"></div>

      <div className="page__container flex-1 w-full">
        <BgMask head={info.head} setShowMore={setShowMore}></BgMask>

        <div
          className={`bottom-popup flex flex-col fixed bottom-0 left-0 w-full rounded-tl-3xl rounded-tr-3xl bg-[#181425] transition-all duration-300 ${
            showMore ? 'bottom-popup--heigher group' : ''
          }`}
          style={{
            height: showMore ? `70vh` : '45.44vh',
          }}
          onTouchStart={(e) => touchstart(e, 'all')}
          onTouchMove={(e) => touchmove(e, 'all')}
          onTouchEnd={() => touchend()}
        >
          <div
            className="touch__block flex-shrink-0 pt-2 pb-7"
            onTouchStart={touchstart}
            onTouchMove={touchmove}
            onTouchEnd={touchend}
          >
            <div className="popup__bar mx-auto mb-7 w-10 h-1 rounded-2xl bg-[#363442]"></div>
            <div
              className="popup__header flex justify-center items-center mb-8 text-2xl leading-5 font-bold text-white"
              onClick={() => {
                setChangeNickNameDialogVisible(true);
              }}
            >
              <span>{info.name}</span>
              {info.styleType === 'PROFESSIONALLY' && (
                <Image
                  className="icon mt-[2px] mx-1"
                  width={20}
                  height={20}
                  alt=""
                  src="/icons/pen.png"
                />
              )}
            </div>
            <div className="popup__line mx-auto w-[calc(100vw-theme(padding.5)*2)] h-[2px] bg-[#252331]"></div>
          </div>
          <div className="popup__container overflow-y-hidden flex-1 p-5 pt-0 group-[.bottom-popup]:overflow-y-auto">
            <div className="container__content leading-[31px] text-[17px] text-white whitespace-pre-wrap">
              {info.character}
            </div>
          </div>
        </div>
      </div>

      <CenterPopup
        title={t('component.delete') + info.name}
        confirmText={t('component.accept')}
        cancleText={t('component.cancel')}
        isBlack
        plain
        plainBtn
        open={deleteDialog}
        onClose={setDeleteDialog}
        onConfirm={onDelete}
      ></CenterPopup>

      <CenterPopup
        title={t('indexMine.changeNickname')}
        confirmText={t('component.accept')}
        isBlack
        needClose
        open={changeNickNameDialogVisible}
        onClose={setChangeNickNameDialogVisible}
        onConfirm={changeNickname}
      >
        <textarea
          className="change-nickname__slot outline-none overflow-y-auto resize-none mb-6 p-4 w-full h-20 text-white rounded-xl bg-[#3f3b52]"
          value={info.name}
          onChange={({ target }) => {
            setInfo((state) => {
              return {
                ...state,
                name: target.value,
              };
            });
          }}
        ></textarea>
      </CenterPopup>
    </div>
  );
}

const BgMask: FC<{
  setShowMore: (bol: boolean) => void;
  head: string;
}> = ({ setShowMore, head }) => {
  return (
    <div
      className="bg relative w-full h-[70vh]"
      onClick={() => setShowMore(false)}
    >
      {head && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="bg__img border-none w-full h-full object-cover object-top"
          alt=""
          src={filterImage(head)}
        />
      )}
      <div
        className="bg__top absolute left-0 top-[-1px] w-full h-28"
        style={{
          background:
            'linear-gradient(180deg, #181425 0%, rgba(24, 20, 37, 0) 100%)',
        }}
      ></div>
      <div className="bg__mask absolute left-0 top-0 w-full h-full bg-[#181425] opacity-10"></div>
    </div>
  );
};
