'use client';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { filterImage } from '@/utils/business';
import { Dispatch, FC, SetStateAction, useContext, useState } from 'react';
import { ChatContext } from './Client';
import { fetchRequest } from '@/utils/request';
import { cn } from '@/lib/utils';
import { CenterPopup } from '@/components/CenterPopup';
import Image from 'next/image';

const state: Indexes = {
  actionMap: {},
};
export const Action: FC<{
  actions: any[];
  checkEntering: () => boolean;
  onUnlock: (source: string) => void;
}> = ({ checkEntering, actions, onUnlock }) => {
  const ctx = useContext(ChatContext);
  const [actionMap, setActionMap] = useState<Indexes>({});
  const [inp1, setInp1] = useState('');
  const [inp2, setInp2] = useState('');
  const [actionDialogVisible, setActionDialogVisible] = useState(false);
  const openActionPopup = (item: any) => {
    ctx.setActionsVisible?.(false);
    state.actionMap = item;
    setActionMap(item);
    setInp1('');
    setInp2('');
    if (item.type === -1) {
      setAction();
      return;
    }
    setTimeout(() => {
      setActionDialogVisible(true);
    }, 0);
  };

  const setAction = () => {
    if (checkEntering()) return;
    ctx.state!.entering = true;
    setActionDialogVisible(false);

    const { action, copywritingOne, copywritingTwo } = state.actionMap!;
    fetchRequest('/restApi/friendAction/girlfriendActionProcessing', {
      copywritingOne: inp1 || copywritingOne || '',
      copywritingTwo: inp2 || copywritingTwo || '',
      action,
      giftFriendId: ctx.state!.friendId,
    })
      .then((res) => {
        if (res.code === 1001) {
          onUnlock('VIP_action');
        } else if (res.code === 1002) {
          ctx.setUnlockType?.('closer-msg');
          setTimeout(() => {
            ctx.setUnlockDialogVisible?.(true);
          }, 0);
        }
      })
      .finally(() => {
        ctx.state!.entering = false;
      });
  };
  return (
    <>
      <Drawer open={ctx.actionsVisible} onOpenChange={ctx.setActionsVisible}>
        <DrawerContent className="!bg-[#181624]">
          <DrawerHeader>
            <DrawerTitle className="text-white text-left">
              {ctx.t!('chat.actions')}
            </DrawerTitle>
          </DrawerHeader>

          <div className="actions-list grid grid-cols-4 gap-y-12 pb-10">
            {actions.map((item: any) => (
              <div
                className="action-item flex justify-center relative"
                key={item.id}
                onClick={() => {
                  openActionPopup(item);
                }}
              >
                <Image
                  alt={item.action}
                  className="action-icon"
                  width={44}
                  height={44}
                  src={filterImage(item.expression)}
                />
                <div className="action-label absolute top-12 left-2/4 -translate-x-2/4 text-sm text-white text-center w-full">
                  {item.action}
                </div>
              </div>
            ))}
            <div className="slot__list"></div>
          </div>
        </DrawerContent>
      </Drawer>

      <CenterPopup
        title={actionMap.mainTitle}
        subtitle={actionMap.subTitle}
        confirmText={ctx.t!('component.accept')}
        cancleText={ctx.t!('component.cancel')}
        plainBtn
        isAction
        open={actionDialogVisible}
        onClose={setActionDialogVisible}
        onConfirm={setAction}
      >
        <div
          className={cn(
            'action__slot group',
            actionMap.type === 1 ? 'is-two' : ''
          )}
        >
          {actionMap.type === 1 && (
            <input
              className="firstInp inp group-[.is-two]:mt-6 mx-auto px-4 w-64 h-14 text-lg text-black rounded-2xl bg-white placeholder:text-[#a19ea9]"
              placeholder={actionMap.copywritingOne}
              value={inp1}
              onChange={({ target }) => {
                setInp1(target.value);
              }}
              type="text"
            />
          )}

          <input
            className="secondInp mt-11 mb-12 inp group-[.is-two]:mt-5 mx-auto px-4 w-64 h-14 text-lg text-black rounded-2xl bg-white placeholder:text-[#a19ea9]"
            value={inp2}
            onChange={({ target }) => {
              setInp2(target.value);
            }}
            placeholder={actionMap.copywritingTwo}
            type="text"
          />
        </div>
      </CenterPopup>
    </>
  );
};
