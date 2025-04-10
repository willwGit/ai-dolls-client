'use client';
import { useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { useBusWatch } from '@/hooks/use-bus-watch';

export const Loading = () => {
  const [visible, setVisible] = useState(false);
  useBusWatch('setGlobalLoading', (val: unknown) => {
    setVisible(val as boolean);
  });
  return (
    <Dialog open={visible}>
      <DialogContent>
        <div className="bg-black/40 size-24 !rounded-s flex justify-center items-center">
          <span className="loading loading-spinner size-10 text-white"></span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
