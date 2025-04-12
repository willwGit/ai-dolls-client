"use client";
/* eslint-disable @next/next/no-img-element */
import React, { Dispatch, SetStateAction, useRef } from "react";
import "./unlock.scss"; // 假设您的 SCSS 文件命名为 YourComponentName.scss
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTranslation } from "@/locales/client";

export interface UnlockProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  type: "free-chat" | "closer-msg" | "closer-pic" | "closer-action";
  close: () => void; // 添加关闭和确认的方法类型
  confirm: (unlockType: UnlockProps["type"]) => void;
}

export const Unlock: React.FC<UnlockProps> = ({
  type,
  visible,
  setVisible,
  close,
  confirm,
}) => {
  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [img, setImg] = React.useState("");
  const { t } = useTranslation();

  const open = () => {
    switch (type) {
      case "free-chat":
        setTitle(t("chat.freelyChat")); // 用实际翻译函数替换
        setImg("/images/free-chat.png"); // 调整路径和方法以匹配实际情况
        setSubtitle(t("chat.subfreelyChat"));
        break;
      case "closer-msg":
        setTitle(t("chat.beCloser"));
        setImg("/images/closer-msg.png");
        setSubtitle(t("chat.closerMsg"));
        break;
      case "closer-pic":
        setTitle(t("chat.beCloser"));
        setImg("/images/close-pic.png");
        setSubtitle(t("chat.closerPic"));
        break;
      default:
        break;
    }
    // uni.hideKeyboard(); // 在 React 中找到对应的实现方法或去除
  };

  React.useEffect(() => {
    // 逻辑来决定是否自动打开 Popup
    if (visible) {
      open();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Dialog open={visible}>
      <DialogContent className="bg-white">
        <div className="Unlock">
          <div className="container__padding"></div>
          <div className="container__inner bg-white rounded-2xl shadow-md">
            <img className="inner__head-img" src={img} alt="" />
            <div className="inner__mask bg-blue-500/40"></div>
            <div className="inner__content">
              <div className="content__title text-slate-800">{title}</div>
              <div className="content__subtitle text-slate-600">{subtitle}</div>
            </div>
            <div className="inner__bottom">
              <div className="bottom__mask bg-blue-100/80"></div>
              <div
                className="bottom__btn bg-blue-500 text-white"
                onClick={() => {
                  confirm(type);
                }}
              >
                {t("chat.unlockUnlimitedAccess")}
              </div>
            </div>
          </div>
          <img
            className="container__close"
            src="/icons/close-circle.png" // 调整路径和方法以匹配实际情况
            alt="close"
            onClick={() => {
              setVisible(false);
              close();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
