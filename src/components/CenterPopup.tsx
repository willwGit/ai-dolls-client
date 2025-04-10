/* eslint-disable @next/next/no-img-element */
'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { cn } from '@/lib/utils';
import React, { FC } from 'react';
import { DialogDescription } from '@radix-ui/react-dialog';
import './center-popup.scss';
import { string } from 'zod';

type CenterPopupProps = {
  title: string;
  subtitle: string;
  cancleText: string;
  confirmText: string;
  needClose: boolean;
  isBlack: boolean;
  plain: boolean;
  plainBtn: boolean;
  isAction: boolean;
  open: boolean;
  children?: React.ReactNode;
  onConfirm?: () => void;
  onClose?: (bol: false) => void;
  className?: string;
};

export const CenterPopup: FC<Partial<CenterPopupProps>> = ({
  title = '',
  subtitle = '',
  cancleText = '',
  confirmText = '',
  needClose = false,
  isBlack = false,
  plain = false,
  plainBtn = false,
  isAction = false,
  open = false,
  onConfirm,
  onClose,
  children,
  className,
}) => {
  return (
    <Dialog open={open}>
      <DialogContent>
        <div
          className={cn(
            'centerPopup__container',
            isBlack ? 'is-black' : '',
            plain ? 'plain' : '',
            isAction ? 'action' : '',
            className
          )}
        >
          {needClose && (
            <img
              className="centerPopup__container__close"
              src="/icons/close.png"
              onClick={() => onClose?.(false)}
              alt=""
            />
          )}

          <DialogHeader>
            {title && (
              <DialogTitle className="centerPopup__container__title">
                {title}
              </DialogTitle>
            )}
            {subtitle && (
              <DialogDescription className="centerPopup__container__subtitle">
                {subtitle}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="centerPopup__container__slot">{children}</div>

          {plainBtn ? (
            <div className="centerPopup__container__btns--plain">
              {cancleText && (
                <div className="btn" onClick={() => onClose?.(false)}>
                  {cancleText}
                </div>
              )}

              {confirmText && (
                <div
                  className="btn rtl:!border-l-0 rtl:border-r-[0.5px] rtl:border-[#545458]"
                  onClick={onConfirm}
                >
                  {confirmText}
                </div>
              )}
            </div>
          ) : cancleText || confirmText ? (
            <div
              className={cn(
                'centerPopup__container__btns',
                cancleText && confirmText ? 'between' : ''
              )}
            >
              {cancleText && (
                <button
                  className="cus-btn thin-y cancle"
                  onClick={() => onClose?.(false)}
                >
                  {cancleText}
                </button>
              )}

              {confirmText && (
                <button className="cus-btn thin-y" onClick={onConfirm}>
                  {confirmText}
                </button>
              )}
            </div>
          ) : (
            <></>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
