/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
/* eslint-disable @next/next/no-img-element */
import { SystemStore } from "@/hooks/use-system";
import { UserStore, useUserStore } from "@/hooks/use-user";
import { AppConfigEnv, cn } from "@/lib/utils";
import { filterImage } from "@/utils/business";
import { debounce, throttle } from "@/utils/debounce-throttle";
import { fetchRequest } from "@/utils/request";
import { TFunction } from "i18next";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dispatch,
  FC,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AiOutlineLeft } from "react-icons/ai";
import { toast } from "sonner";
import ChatWebSocket from "../Chat";
import { UnlockProps } from "./Unlock";
import { FaChevronLeft } from "react-icons/fa6";
import { SOURCE } from "../enum";

export type ChatContextState = {
  t: TFunction<"translation", undefined>;
  detail: Indexes;
  setDetail: Dispatch<SetStateAction<ChatContextState["detail"]>>;
  shareDialogVisible: boolean;
  setShareDialogVisible: Dispatch<
    SetStateAction<ChatContextState["shareDialogVisible"]>
  >;
  isNSFW: boolean;
  setIsNSFW: Dispatch<SetStateAction<ChatContextState["isNSFW"]>>;
  otherPage: string;
  setOtherPage: Dispatch<SetStateAction<ChatContextState["otherPage"]>>;
  sceneBtnsVisible: boolean;
  toolsVisible: boolean;
  readyVoice: null | string | Blob;
  setReadyVoice: Dispatch<SetStateAction<ChatContextState["readyVoice"]>>;
  focus: boolean;
  setFocus: Dispatch<SetStateAction<ChatContextState["focus"]>>;
  bg: string;
  setBg: Dispatch<SetStateAction<ChatContextState["bg"]>>;
  isTransparent: boolean;
  setIsTransparent: Dispatch<SetStateAction<ChatContextState["isTransparent"]>>;
  list: any[];
  setList: Dispatch<SetStateAction<ChatContextState["list"]>>;
  sceneBtns: any[];
  setSceneBtns: Dispatch<SetStateAction<ChatContextState["sceneBtns"]>>;
  isPress: boolean;
  setIsPress: Dispatch<SetStateAction<ChatContextState["isPress"]>>;
  guideStep: number;
  setGuideStep: Dispatch<SetStateAction<ChatContextState["guideStep"]>>;
  isPlotStage: boolean;
  setIsPlotStage: Dispatch<SetStateAction<ChatContextState["isPlotStage"]>>;
  unlockDialogVisible: boolean;
  setUnlockDialogVisible: Dispatch<
    SetStateAction<ChatContextState["unlockDialogVisible"]>
  >;
  setVideoData: Dispatch<
    SetStateAction<{
      videoUrl: string;
      poster: string;
    }>
  >;
  setVideoVisible: Dispatch<SetStateAction<boolean>>;
  afterSysNotice: boolean;
  setAfterSysNotice: Dispatch<
    SetStateAction<ChatContextState["afterSysNotice"]>
  >;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<ChatContextState["loading"]>>;
  message: string;
  setMessage: Dispatch<SetStateAction<ChatContextState["message"]>>;
  tools: never[];
  setTools: Dispatch<SetStateAction<ChatContextState["tools"]>>;
  actions: never[];
  setActions: Dispatch<SetStateAction<ChatContextState["actions"]>>;
  unlockType: UnlockProps["type"];
  setUnlockType: Dispatch<SetStateAction<ChatContextState["unlockType"]>>;
  curSceneStartT: number;
  setCurSceneStartT: Dispatch<
    SetStateAction<ChatContextState["curSceneStartT"]>
  >;
  actionsVisible: boolean;
  setActionsVisible: Dispatch<
    SetStateAction<ChatContextState["actionsVisible"]>
  >;
  clearRecord: () => void;
  sendPreinstall: (item: string | Indexes, label?: string) => void;
  state: {
    /**
     * recordLength 复制版本，修改 recordLength 时应该同步调用 setRecordLength
     */
    recordLength: number;
    friendId: string;
    listLoading: boolean;
    entering: boolean;
    readyReturn: boolean;
    afterSysNotice: boolean;
    readyItem: null | Indexes;
    lastMsgType: UnlockProps["type"];
    enteringId: string;
    recorderManager: null | Indexes;
    systemTempItem: Indexes;
    aiThinking: boolean;
    currentAudioItem: Indexes;
    pressTimer: null | NodeJS.Timeout;
    recordTimer: null | NodeJS.Timeout;
    firstId: string;
    lastScrollTop: number;
    lastAlbumsTop: number;
    tempStep: number;
    needUpdateImg: Indexes;
    hasGuide: boolean;
    guideMapTemp: any;
    audioContext: HTMLAudioElement | null | Indexes;
    /**
     * readyVoice 复制版本，修改 readyVoice 时应该同步调用 setReadyVoice
     */
    readyVoice: null | string | Blob;
    queringPast: boolean;
  };
  dir: "ltr" | "rtl";
  recordLength: number;
  setRecordLength: Dispatch<SetStateAction<ChatContextState["recordLength"]>>;
  homePageRef: { current: any };
  system: SystemStore["systemState"];
  userState: UserStore["userState"];
};
export const ChatContext = createContext<Partial<ChatContextState>>({});

export const ClientHead: FC<{
  onUnlock: (source: string) => void;
}> = ({ onUnlock }) => {
  const ctx = useContext(ChatContext);
  const searchParams = useSearchParams();
  const router = useRouter();
  const routeSource = useRef<SOURCE>(searchParams.get("source") as SOURCE);
  const switchChange = () =>
    throttle(() => {
      const newIsNSFW = !ctx.isNSFW;
      ctx.setIsNSFW?.(newIsNSFW);
      fetchRequest(
        `/restApi/friend/adultSwitch/${ctx.state?.friendId}?status=${
          newIsNSFW ? "1" : "0"
        }`
      )
        .then((res) => {
          if (res.code === 1001) {
            // 非会员
            ctx.setIsNSFW?.(!newIsNSFW);
            onUnlock("over18years");
          }
        })
        .catch(() => {
          ctx.setIsNSFW?.(!newIsNSFW);
        });
    }, 500);

  const exitScene = () => {
    const isHotDate = ctx.detail?.scene === "HOT_DATE";
    const url = `/restApi/${isHotDate ? "hotDate" : "rolePlay"}/exit/${
      ctx.state!.friendId
    }`;
    fetchRequest(url).then(() => {
      ctx.setDetail?.((state) => ({
        ...state,
        scene: "",
      }));

      ctx.state!.queringPast = false;
    });
  };

  const openHomePage = () => {
    if (!ctx.state!.friendId) return;
    router.push(`home-page?friendId=${ctx.state!.friendId}`);
  };

  const handleBack = () => {
    if (window.history.length > 1 && document.referrer == "") {
      switch (routeSource.current) {
        case SOURCE.USER_CREATE:
          router.replace("/chats");
          break;
        default:
          router.back();
      }
    } else {
      router.replace("/");
    }
  };

  return (
    <div
      className={cn(
        "box-border flex items-center justify-between fixed top-0 left-0 w-full bg-white shadow-sm py-2 px-4 z-20",
        ctx.detail?.styleType === "USER" ? "bg-white" : ""
      )}
    >
      <div className="header__left flex items-center">
        <FaChevronLeft
          onClick={handleBack}
          className="svg-icon size-6 swap-off text-slate-700 font-bold rtl:rotate-180 mr-2"
        />
        <div
          className="box-border w-9 h-9 border border-slate-200 rounded-full bg-center"
          style={{
            backgroundSize: "37px auto",
            backgroundPosition: "center 0",
            backgroundImage: ` url(${filterImage(ctx.detail?.head)})`,
          }}
          onClick={openHomePage}
        ></div>
        <div className="mx-2 mb-0 max-w-28 text-xl font-bold text-slate-800 line-clamp-1">
          {ctx.detail?.name || ""}
        </div>
      </div>
      <div className="flex items-center">
        {Boolean(ctx.detail?.scene) ? (
          <div
            className="flex justify-center items-center px-2 h-8 rounded-md bg-blue-500 font-bold text-sm text-white"
            onClick={exitScene}
          >
            <Image
              className="mr-2"
              width={16}
              height={16}
              src="/icons/exit.png"
              alt=""
            />
            {ctx.t!("chat.exit") + " "}
            {ctx.detail?.scene === "HOT_DATE"
              ? ctx.t!("chat.hotDate")
              : ctx.t!("chat.rolePlay")}
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export const ClientBg: FC = () => {
  const ctx = useContext(ChatContext);

  return (
    <div className="bg fixed z-10 top-0 left-0 flex flex-col w-full">
      {((ctx.detail?.styleType && ctx.detail?.styleType !== "USER") ||
        ctx.detail?.scene) && <div className="bg__padding w-full h-14"></div>}
      <div
        className="bg__mask overflow-hidden flex-1 relative w-full"
        style={{
          background: "rgba(255, 255, 255, 0.5)",
        }}
      >
        {((ctx.detail?.styleType && ctx.detail?.styleType !== "USER") ||
          ctx.detail?.scene) && <div className="mask__cover-padding"></div>}
        {((ctx.detail?.styleType && ctx.detail?.styleType !== "USER") ||
          ctx.detail?.scene) &&
        ctx.detail!.head ? (
          <img
            src={filterImage(ctx.detail!.head)}
            className="mask__img object-cover pointer-events-none w-full h-[calc(100vh-124px)]"
            alt=""
          />
        ) : (
          <img
            className="mask__default pointer-events-none w-full h-[100vh]"
            src="/images/chat-bg.png"
            alt=""
          />
        )}
        <div
          className="mask__cover absolute top-0 left-0 size-full"
          style={{
            background: "rgba(255, 255, 255, 0.7)",
          }}
        ></div>
        <div
          className="mask__top absolute top-0 left-0 w-full h-28"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, #ffffff 0%, rgba(255, 255, 255, 0) 100%)",
          }}
        ></div>
        <div
          className="mask__bottom absolute bottom-[-1px] w-full left-0 h-40"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, #ffffff 100%)",
          }}
        ></div>
      </div>
    </div>
  );
};

const state = {
  recordSuccess: false,
  /**
   * deleteVoiceActive 复制版本
   */
  deleteVoiceActive: false,
};
export const ClientSendMsg: FC<{
  sendMsg: (fileExtension?: any) => void;
  destroyAudio: () => void;
  onUnlock: (source: string) => void;
  checkEntering: () => boolean;
  revokeObjectURL: () => void;
}> = ({ sendMsg, destroyAudio, checkEntering, onUnlock, revokeObjectURL }) => {
  const ctx = useContext(ChatContext);
  const [supportedMedia, setSupportedMedia] = useState(true);
  const [deleteVoiceActive, setDeleteVoiceActive] = useState(false);
  let isPress = ctx.isPress;
  const getExtension = (mimeType: string) => {
    const [type] = mimeType.split(";");
    const subtype = type.split("/").pop();
    return subtype || "";
  };

  const setH5Recorder = async (showTip = false) => {
    if (!navigator.mediaDevices || !MediaRecorder) {
      setSupportedMedia(false);
      return;
    }

    const types = [
      "audio/aac", // AAC - 广泛支持的有损格式
      "audio/mp4", // MP4 - 常用于AAC音频
      "audio/mpeg", // MPEG - 常用于MP3
      "audio/ogg", // Ogg Vorbis - 开源格式
      "audio/opus", // Opus - 适合语音和实时通信
      "audio/wav", // WAV - 无损格式
      "audio/webm", // WebM - 开源格式
      "audio/flac", // FLAC - 无损压缩
      "audio/x-m4a", // M4A - 常用于Apple设备
      "audio/x-ms-wma", // WMA - Windows媒体音频
      "audio/webm;codecs=opus", // WebM带Opus编解码器
      "audio/ogg;codecs=vorbis", // Ogg带Vorbis编解码器
      "audio/mp3", // 另一种表示MP3的方式
      "audio/x-aac", // 另一种表示AAC的方式
      "audio/x-wav", // 另一种表示WAV的方式
      "audio/x-mpeg", // 另一种表示MPEG的方式
      "audio/mp4;codecs=mp4a.40.2", // MP4带特定AAC编解码器
    ];

    const type = types.find((item) => MediaRecorder.isTypeSupported(item));

    if (!type) {
      setSupportedMedia(false);
      return;
    }

    const constraints = { audio: true };
    let chunks: any[] = [];

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useStream(stream, chunks, type);
      })
      .catch(() => {
        if (showTip) toast(ctx.t!("chat.allowMicrophone"));
      });
  };

  const useStream = (stream: MediaStream, chunks: any[], type: string) => {
    const fileExtension = getExtension(type);

    (ctx.state!.recorderManager as unknown as MediaRecorder) =
      new MediaRecorder(stream);

    (ctx.state!.recorderManager! as Indexes).onstop = () => {
      const blob = new Blob(chunks, { type });

      chunks = [];
      if (state.recordSuccess) {
        ctx.state!.readyVoice = blob;
        ctx.setReadyVoice?.(blob);
        sendMsg(fileExtension);
      }
    };
    (ctx.state!.recorderManager as unknown as Indexes).ondataavailable = (
      e: Indexes
    ) => {
      chunks.push(e.data);
    };
  };

  const mMove = (e: MouseEvent | TouchEvent) => {
    const pageX = "pageX" in e ? e.pageX : e.touches[0].pageX;
    if (isPress) {
      // 16是外边距 30 是删除图标的大小
      if (ctx.dir === "ltr") {
        state.deleteVoiceActive = pageX >= 16 && pageX <= 16 + 30;
        setDeleteVoiceActive?.(state.deleteVoiceActive);
      } else {
        state.deleteVoiceActive =
          pageX >= window.innerWidth - 16 - 30 &&
          pageX <= window.innerWidth - 16;
        setDeleteVoiceActive?.(state.deleteVoiceActive);
      }
    }
  };

  const mEnd = () => {
    if (ctx.state?.pressTimer) clearTimeout(ctx.state?.pressTimer);
    if (ctx.state?.recordTimer) clearInterval(ctx.state?.recordTimer);

    if (isPress) {
      state.recordSuccess =
        ctx.state!.recordLength >= 1 && !state.deleteVoiceActive;
      ctx.state?.recorderManager?.stop();
    }
    isPress = false;
    ctx.setIsPress?.(false);
    document.removeEventListener("mousemove", mMove);
    document.removeEventListener("mouseup", mEnd);
    document.removeEventListener("touchmove", mMove);
    document.removeEventListener("touchend", mEnd);
  };

  const mStart = () => {
    if (process.env.NODE_ENV === "production") {
      toast("coming soon");
      return;
    }
    revokeObjectURL();
    state.deleteVoiceActive = false;
    setDeleteVoiceActive?.(state.deleteVoiceActive);
    (ctx.state!.pressTimer as unknown as NodeJS.Timeout) = setTimeout(() => {
      console.log(ctx.state?.recorderManager);

      if (!ctx.state?.recorderManager) {
        setH5Recorder(true);
        return;
      }
      destroyAudio();
      if (ctx.state?.recordTimer) clearInterval(ctx.state!.recordTimer);
      ctx.state!.recordLength = 0;
      ctx.setRecordLength?.(ctx.state!.recordLength);
      isPress = true;
      ctx.setIsPress?.(true);

      document.addEventListener("mousemove", mMove);
      document.addEventListener("mouseup", mEnd);
      document.addEventListener("touchmove", mMove);
      document.addEventListener("touchend", mEnd);
      (ctx.state!.recordTimer as unknown as NodeJS.Timeout) = setInterval(
        () => {
          ctx.state!.recordLength += 1;
          ctx.setRecordLength?.(ctx.state!.recordLength);
          if (ctx.state!.recordLength >= 60) {
            if (ctx.state?.recordTimer) clearInterval(ctx.state!.recordTimer);
            isPress = false;
            ctx.setIsPress?.(false);
            state.recordSuccess = !state.deleteVoiceActive;
            (ctx.state?.recorderManager! as Indexes)?.stop();
          }
        },
        1000
      );
      (ctx.state?.recorderManager! as Indexes)?.start();
    }, 200);
  };

  const getASMR = () => {
    if (checkEntering()) return;
    ctx.state!.entering = true;
    fetchRequest("/restApi/chatMessage/getAsmr", {
      friendId: ctx.state!.friendId,
    })
      .then((res) => {
        if (res.code === 1001) {
          onUnlock("unlock_asmr");
        }
      })
      .finally(() => {
        ctx.state!.entering = false;
      });
  };

  const clickTool = ({ name, label }: Indexes<string>) => {
    switch (name) {
      case "LET_ME_SEE_U":
        if (AppConfigEnv.OPEN_SEND_IMG) {
          ctx.sendPreinstall?.("photo", label);
        } else {
          toast("coming soon");
        }
        break;
      case "TAKE_ACTION":
        ctx.setActionsVisible?.(true);
        break;
      case "ASMR":
        getASMR();
        break;
      case "ROLE_PLAY":
        toast("coming soon");
        // TODO
        // sceneRef.value.open();
        break;
      case "HOT_DATE":
        toast("coming soon");
        // TODO
        // sceneRef.value.open(true);
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    debounce(() => {
      if (!AppConfigEnv.isTG) {
        // setH5Recorder();
      }
    });
    return () => {
      ctx?.clearRecord?.();
      destroyAudio();
      document.removeEventListener("mousemove", mMove);
      document.removeEventListener("mouseup", mEnd);
      document.removeEventListener("touchmove", mMove);
      document.removeEventListener("touchend", mEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      className={cn(
        "relative z-20 w-full select-none bottom-0",
        !ctx.otherPage ? "block" : "hidden"
      )}
    >
      {ctx.sceneBtnsVisible && ctx.system?.isFull ? (
        <div className="scene-btns grid grid-cols-2 gap-x-3 px-5">
          {ctx.sceneBtns?.map((item, index) => (
            <div
              key={index}
              className="btn flex h-full items-center px-2 py-3 w-full border border-slate-300 rounded-xl text-sm text-slate-800 bg-white bg-opacity-90"
              onClick={() => {
                ctx.sendPreinstall?.(item);
              }}
            >
              {item.message}
            </div>
          ))}
        </div>
      ) : (
        <></>
      )}
      <div
        className={cn(
          "input-container relative p-4 pb-3 leading-none",
          ctx.bg ? "no-bg bg-transparent" : "bg-white"
        )}
      >
        <textarea
          value={ctx.message}
          className="textarea-dom py-2 pr-[72px] pl-4 w-full h-10 rounded-3xl bg-slate-100 resize-none !outline-none leading-normal rtl:pr-4 rtl:pl-[72px] text-black"
          placeholder={`${
            ctx.isPress || !!ctx.readyVoice ? "" : ctx.t!("chat.typeAMessage")
          }...`}
          maxLength={200}
          disabled={ctx.isPress || !!ctx.readyVoice}
          onChange={({ target }) => {
            ctx.setMessage?.(target.value);
          }}
          onFocus={() => {
            revokeObjectURL();
            ctx.setFocus?.(true);
          }}
          onBlur={({ target }) => {
            revokeObjectURL();

            /**
             * FIX Ios 软键盘消失页面不会掉下来
             */
            window.scrollTo(0, 200);

            ctx.setFocus?.(false);
          }}
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              sendMsg();
            }
          }}
        />
        {ctx.isPress && (
          <div
            className={cn(
              "delete-box flex justify-center items-center absolute top-2/4 left-1 -translate-y-2/4 w-[30px] h-[30px] rounded-full bg-blue-500",
              deleteVoiceActive ? "active bg-blue-600" : "",
              "rtl:left-[unset] rtl:right-1"
            )}
            onClick={() => {
              ctx.state!.readyVoice = null;
              ctx.setReadyVoice?.(null);
            }}
          >
            <Image
              className="delete-icon"
              width={18}
              height={18}
              src="/icons/trash--voice.png"
              alt="delete"
            />
          </div>
        )}
        {(ctx.isPress || !!ctx.readyVoice) && (
          <div
            className={cn(
              "wrapper__item flex items-center absolute top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4",
              ctx.isPress ? "flex" : "hidden"
            )}
          >
            <Image
              className="voice-icon"
              width={33}
              height={33}
              src="/icons/voice-progress.png"
              alt="voice"
            />
            <span className="text-lg left-32 text-slate-700 tracking-[-0.5px] block ml-2 rtl:ml-0 rtl:mr-2">
              0:{`${ctx.recordLength}`.padStart(2, "0")}
            </span>
          </div>
        )}
        <div className="btn-wrapper absolute top-2/4 -translate-y-2/4 right-8 rtl:right-[unset] rtl:left-8">
          {Boolean(ctx.message) || ctx.focus ? (
            <Image
              onClick={() => {
                sendMsg();
              }}
              width={22}
              height={22}
              className="send-icon"
              alt="send"
              src="/icons/send.png"
            ></Image>
          ) : supportedMedia ? (
            <div
              className={cn("microphone flex items-center")}
              onTouchStart={() => {
                mStart();
              }}
              onMouseDown={(e) => {
                mStart();
              }}
            >
              <Image
                className={cn(
                  "icon ml-2 pointer-events-none rtl:ml-0 rtl:mr-2",
                  ctx.isPress ? "opacity-0" : "opacity-100"
                )}
                width={22}
                height={22}
                src="/icons/microphone.png"
                alt="microphone"
              />
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
      {/* <ScrollArea> */}
      {ctx.toolsVisible && ctx.list?.length ? (
        <div
          className={cn(
            "tools-bar flex items-center flex-nowrap pl-6 pb-4 overflow-x-auto",
            ctx.bg ? "no-bg bg-transparent" : "bg-white"
          )}
          style={{
            unicodeBidi: "normal",
          }}
        >
          {ctx.tools?.map((tool: any, index: number) => (
            <div key={index}>
              <div
                className="tool relative flex justify-center items-center mr-10 w-9 h-9"
                onClick={() => {
                  clickTool(tool);
                }}
              >
                <Image
                  className="tool__icon"
                  width={33}
                  height={33}
                  src={filterImage(tool.iconUrl)}
                  alt=""
                />

                <GuideStep tool={tool}></GuideStep>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <></>
      )}
      {/* <ScrollBar className="h-1" orientation="horizontal" /> */}
      {/* </ScrollArea> */}
    </div>
  );
};

export const GuideStep: FC<{
  tool: any;
}> = ({ tool }) => {
  const ctx = useContext(ChatContext);
  const { setData } = useUserStore();
  const addGuideStep = () => {
    const guide = ctx.guideStep! + 1;
    ctx.setGuideStep?.((state) => guide);

    if (guide > 3) {
      if (ctx.state?.hasGuide) return;
      ctx.state!.hasGuide = true;
      fetchRequest("/restApi/member/setHasEnterNewChatPage").then(() => {
        setData();
      });
    }
  };

  return ctx.guideStep === tool.step ? (
    <>
      <div
        className="tool__guide__mask fixed z-40 top-0 left-0 size-full bg-black bg-opacity-75"
        onClick={(e) => e.stopPropagation()}
      ></div>
      <div
        className="tool__guide__main fixed z-50 bottom-44 left-0 w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          alt="guide girl"
          width={145}
          height={114}
          className="main__girl mx-auto"
          src="/images/guide-girl.png"
        />
        <div className="main__tip px-5 pt-2 pb-5 text-lg italic text-white text-center">
          {tool.guideTip}
        </div>
        <div
          className="main__btn mx-auto flex items-center justify-center w-32 h-11 rounded-full text-lg text-white"
          style={{
            background: "linear-gradient(to right, #665ef2 0%, #8f54ee 100%)",
          }}
          onClick={() => {
            addGuideStep();
          }}
        >
          {ctx.t!("chat.gotIt")}
        </div>
      </div>
      <div
        className={cn(
          "tool__guide__inner box-content w-max flex items-center fixed -translate-x-1 bottom-16 z-50 p-3 border-2 border-[#745efe] rounded-xl",
          tool.step === 3 ? "left-[22px] translate-x-0" : "",
          `step${tool.step}`
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {tool.guides.map((item: any, index: number) => (
          <Image
            alt=""
            width={41}
            height={41}
            className={cn("guide-icon", index > 0 ? "ml-6" : "")}
            key={index}
            src={filterImage(item.iconUrl)}
          />
        ))}
        {tool.step === 3 ? (
          <Image
            alt=""
            height={99}
            width={99}
            className="guide-arrows absolute -bottom-7 left-0 size-[99px] -translate-y-full pointer-events-none"
            src="/images/guide-arrows3.png"
          />
        ) : (
          <Image
            height={99}
            width={99}
            alt=""
            className="guide-arrows absolute bottom-3 -left-2 size-[99px] -translate-x-full pointer-events-none"
            src="/images/guide-arrows1.png"
          />
        )}
      </div>
    </>
  ) : (
    <></>
  );
};
