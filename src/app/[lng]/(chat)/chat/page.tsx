"use client";
import { useSystemStore } from "@/hooks/use-system";
import { AppConfigEnv, cn } from "@/lib/utils";
import { debounce, createDebounce } from "@/utils/debounce-throttle";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChatContext,
  ChatContextState,
  ClientBg,
  ClientHead,
  ClientSendMsg,
} from "./_components/Client";
import { useBusWatch } from "@/hooks/use-bus-watch";
import { fetchRequest } from "@/utils/request";
import {
  filterAbbrTime,
  filterImage,
  logout,
  uploadFile,
} from "@/utils/business";
import { toast } from "sonner";
import { useTranslation } from "@/locales/client";
import ChatWebSocket from "./Chat";
import { ScrollView } from "./_components/ScrollView";
import {
  AsmrRecord,
  AudioRecord,
  AwaitRecord,
  BubbleFooter,
  ImageVideoRecorder,
  SystemRecord,
  TextRecord,
} from "./_components/ChatRecord";
import { useUserStore } from "@/hooks/use-user";
import { Unlock, UnlockProps } from "./_components/Unlock";
import { Action } from "./_components/Action";
import { dir } from "i18next";
import { VideoDialog } from "./_components/Video";
import Cookies from "js-cookie";
import { FC } from "react";

const defaultState = {
  friendId: "",
  listLoading: false,
  entering: false,
  readyReturn: false,
  afterSysNotice: true,
  readyItem: null,
  enteringId: "",
  recorderManager: null,
  systemTempItem: {},
  aiThinking: false,
  currentAudioItem: {},
  pressTimer: null,
  recordTimer: null,
  firstId: "",
  lastScrollTop: 0,
  lastAlbumsTop: 0,
  tempStep: 0,
  recordLength: 0,
  needUpdateImg: {},
  hasGuide: false,
  readyVoice: null,
  queringPast: false,
};

const state: ChatContextState["state"] = {
  ...defaultState,
  lastMsgType: "closer-pic",
  guideMapTemp: null,
  audioContext: null,
};

const MAX_LEN = 80;

export default function Chat({ params: { lng } }: CustomReactParams) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userState } = useUserStore();
  const { t } = useTranslation();
  const [cDebounce, clearFun] = createDebounce();
  const { systemState } = useSystemStore();
  const [detail, setDetail] = useState<Indexes>({});
  const Chat = useRef(new ChatWebSocket());
  const [actionsVisible, setActionsVisible] = useState(false);
  /**
   * 没有token 时存在。所有剧情
   */
  const _plot = useRef<any[]>([]);
  /**
   * 没有token 时存在。剧情下标
   */
  const plotIndex = useRef(0);
  const [list, setList] = useState<any[]>([]);
  const [sceneBtns, setSceneBtns] = useState<any[]>([]);
  const [isPress, setIsPress] = useState(false);
  const [isPlotStage, setIsPlotStage] = useState(false);
  const [unlockDialogVisible, setUnlockDialogVisible] = useState(false);
  const [afterSysNotice, setAfterSysNotice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isNSFW, setIsNSFW] = useState(false);
  const [bg, setBg] = useState("");
  const [focus, setFocus] = useState(false);
  const [message, setMessage] = useState("");
  const [guideStep, setGuideStep] = useState(1);
  const [tools, setTools] = useState([]);
  const [actions, setActions] = useState([]);
  const [unlockType, setUnlockType] =
    useState<UnlockProps["type"]>("closer-msg");
  const [curSceneStartT, setCurSceneStartT] = useState(0);
  const [isTransparent, setIsTransparent] = useState(true);
  const [videoVisible, setVideoVisible] = useState(false);
  const [videoData, setVideoData] = useState({
    videoUrl: "",
    poster: "",
  });
  const [readyVoice, setReadyVoice] = useState<string | null | Blob>(null);
  const [recordLength, setRecordLength] = useState(0);
  const scrollDom = useRef<HTMLDivElement | null>(null);

  const newestId = useMemo(() => {
    const [item] = list.slice(-1);
    if (!item) return "";
    return item.id;
  }, [list]);
  const sceneBtnsVisible = useMemo(() => {
    return Boolean(sceneBtns.length) && isPlotStage && afterSysNotice;
  }, [afterSysNotice, isPlotStage, sceneBtns.length]);

  const toolsVisible = useMemo<boolean>(() => {
    return !isPlotStage && !detail.scene;
  }, [detail.scene, isPlotStage]);

  const onUnlock = (source: string) => {
    let scene = source;
    if (scene === "closer-msg") scene = "unlimited_chat";
    if (scene === "free-chat") scene = "custom_chat";
    if (scene === "closer-pic") scene = "unlimited_photo";

    const { name, head, animationCover, friendStyleName, id } = detail;
    const friendForm: any = {
      head,
      id,
      animationCover,
    };
    if (name !== friendStyleName) friendForm.name = name;
    router.push(
      `create-result?source=${scene}&friendForm=${encodeURIComponent(
        JSON.stringify(friendForm)
      )}`
    );
  };

  const scrollToBottom = (duration: number = 200) => {
    if (state.queringPast) return;

    const element = scrollDom.current;
    if (!element) return;

    const start = element.scrollTop;
    const end = element.scrollHeight - element.clientHeight;
    const change = end - start;
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      element.scrollTop = start + change * progress;

      if (elapsedTime < duration) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  const sendPreinstall = (item: any, label?: string) => {
    debounce(
      () => {
        if (!Cookies.get("token")) {
          onSocketMessage({
            data: JSON.stringify({
              message: item.message,
              source: "MEMBER",
              id: 2 + "xxx",
              timestamp: String(Date.now()),
              type: "TEXT",
            }),
          });

          handAiReply(plotIndex.current + 1);
          return;
        }

        if (checkEntering()) return;

        const photoForm = {
          friendId: state!.friendId,
          type: "TEXT",
          message: label,
          source: "MEMBER",
          handlerType: "GET_PHOTO",
          isPlotStage: sceneBtnsVisible,
        };

        if (item === "photo") {
          state!.lastMsgType = "closer-pic";
        } else if ((item as Indexes).disabled) return;

        state!.entering = true;

        Chat.current?.sendMsg(
          JSON.stringify(item === "photo" ? photoForm : item),
          item === "photo" ? "photo" : "scene"
        );
      },
      100,
      [item, label]
    );
  };

  const getDetail = () => {
    let loading = true;
    setLoading(loading);
    fetchRequest(`/restApi/friend/detail/${state.friendId}`)
      .then((res) => {
        const { adultSwitch, sceneDetail, head, styleType } = res.result;
        setIsNSFW(adultSwitch === 1);
        setDetail(res.result || {});
        setBg(sceneDetail?.imageUrl || (styleType !== "USER" && head) || "");
        getList();
        initAudio();
      })
      .catch(() => {
        setLoading(false);
        setTimeout(() => {
          router.replace("/chats");
        }, 800);
      });
  };

  const onAudioUpdate = () => {
    setLoading(false);
    (state.currentAudioItem as Indexes).playing =
      !state.audioContext?.paused &&
      !state.audioContext?.ended &&
      state.audioContext?.readyState &&
      state.audioContext?.readyState > 2;
    const total = (state.currentAudioItem as Indexes).voiceDuration;
    const now = state.audioContext?.currentTime!;
    const progress = Math.ceil((now / total) * 9);
    (state.currentAudioItem as Indexes).voiveProgress = progress;

    setList((l) => {
      const CopyList = [...l];
      const index = l.findIndex((i) => i.id === state.currentAudioItem.id);

      if (index >= 0) {
        CopyList[index] = state.currentAudioItem;
      }

      return CopyList;
    });
  };

  const destroyAudio = (type: string | Event = "") => {
    setLoading(false);
    (state.currentAudioItem as Indexes).playing = false;
    (state.currentAudioItem as Indexes).voiveProgress = 0;
    state.currentAudioItem = {};
    if (state.audioContext && type === "clear") {
      state.audioContext.pause();
      state.audioContext.removeEventListener("error", onAudioError);
      state.audioContext.removeEventListener("ended", destroyAudio);
      state.audioContext.removeEventListener("timeupdate", onAudioUpdate);
    }
  };

  const initAudio = () => {
    state.audioContext = new Audio();

    state.audioContext.addEventListener("error", onAudioError);
    state.audioContext.addEventListener("ended", destroyAudio);
    state.audioContext.addEventListener("timeupdate", onAudioUpdate);
  };

  const onAudioError = () => {
    destroyAudio();
    toast.warning(t("component.loadFail"));
  };

  const getTools = () => {
    fetchRequest("/restApi/chatMessage/component", {
      friendId: state.friendId,
      scope: process.env.NODE_ENV === "development" ? "ALL" : "PUTAWAY",
    }).then(({ result }) => {
      setTools([]);
      // 这里是 == 因为 hasEnterNewChatPage 实际是数字类型
      const needGuide =
        userState.hasEnterNewChatPage == "0" && systemState.isFull;
      state.guideMapTemp = null;
      const langMap = {
        ROLE_PLAY: t("chat.rolePlay"),
        HOT_DATE: t("chat.hotDate"),
        ASMR: "ASMR",
      };

      const copyTools: never[] = [];
      result.rows?.forEach((item: any) => {
        const { name, label, iconUrl2, extension } = item;
        const { reviewHide, ugcHide } = JSON.parse(extension || "{}");
        const map = {
          name,
          label,
          reviewHide,
          ugcHide,
          iconUrl: filterImage(iconUrl2),
        };
        if (item.name === "CALL") {
          // 这段没有实际作用
          // state.callToolMap = map
        } else {
          if (needGuide) {
            setGuideData(map, langMap[map.name as keyof typeof langMap]);
          }
          copyTools.push(map as never);
        }
      });
      setTools(copyTools);
    });
  };

  const setGuideData = (map: any, label: string, guideStep?: number) => {
    if (
      !(
        (!map.reviewHide || systemState.isFull) &&
        !(map.ugcHide && detail.styleType === "USER")
      )
    )
      return;
    const temp = JSON.parse(JSON.stringify(map));
    if (["ROLE_PLAY", "HOT_DATE", "ASMR"].includes(map.name)) {
      if (!state.guideMapTemp) {
        state.guideMapTemp = map;
        map.step = 3;
        map.guideTip = t("chat.guideTip3") + label;
        state.guideMapTemp.guides = [temp];
      } else {
        state.guideMapTemp.guideTip += `, ${label}`;
        state.guideMapTemp.guides.push(temp);
      }
    } else if (map.name === "LET_ME_SEE_U") {
      map.guides = [temp];
      map.step = 1;
      map.guideTip = t("chat.guideTip1");
    } else if (map.name === "TAKE_ACTION") {
      map.guides = [temp];
      map.step = 2;
      map.guideTip = t("chat.guideTip2");
    }

    if (map.step && (!guideStep || map.step < guideStep)) {
      state.tempStep = map.step;
    }
  };

  const getList = () => {
    if (state.listLoading) return;
    state.listLoading = true;

    const form = {
      firstMessageId: newestId.value,
      friendId: state.friendId,
      pageSize: 10,
    };

    fetchRequest("/restApi/chatMessage/list", form)
      .then(({ result }) => {
        const list = result.rows?.reverse() || [];
        list.forEach((item: any) => {
          onSocketMessage(item);
        });

        if (isTransparent) {
          setLoading(false);
          setIsTransparent(false);
        }
      })
      .finally(() => {
        state.listLoading = false;
      });
  };

  const clearAllMask = () => {
    if (state.tempStep && !state.hasGuide) setGuideStep(state.tempStep);
    setLoading(false);
  };

  const onSocketMessage = (e: any, isSocket: boolean = false) => {
    let isFormList = false;
    let item: any;
    if (e.id) {
      item = e;
      isFormList = true;
    } else {
      const { data = "{}" } = e;
      if (data === "PONG") return;
      item = JSON.parse(data);
      if (item.type === "HEARTBEAT") return;
    }

    state.entering = false;

    if (list.findIndex((listItem) => item.id === listItem.id) !== -1) return;

    if (state.readyReturn) {
      state.afterSysNotice = false;
      state.readyItem = e;
      state.readyReturn = false;
      return;
    }
    state.readyReturn = false;

    if (item.type === "SYSTEM_NOTICE" && item.scene) {
      setCurSceneStartT(
        item.timestamp > curSceneStartT ? item.timestamp : curSceneStartT
      );

      if (!isFormList) {
        state.readyReturn = true;
      }

      if (isSocket) {
        clearAllMask();
      }
    }

    if (item.type === "NOT_PREMIUM_ERROR") {
      if (sceneBtns.length && isPlotStage) {
        setUnlockType("free-chat");
      } else {
        setUnlockType(state.lastMsgType);
      }
      setUnlockDialogVisible(true);
      return;
    }

    let {
      extObj,
      isLastMessage,
      plotRound,
      isPlotStage: itemIsPlotStage,
    } = item;
    if (extObj) {
      const jsonExtObj = JSON.parse(extObj) || {};

      if (jsonExtObj.plotReplies) {
        setSceneBtns(jsonExtObj.plotReplies || []);

        if (isFormList && isLastMessage && plotRound) {
          itemIsPlotStage = systemState.isFull && !!itemIsPlotStage;
          setIsPlotStage(itemIsPlotStage);
        }
      }
    }

    if (!isFormList && item.source !== "MEMBER") {
      itemIsPlotStage = systemState.isFull && !!itemIsPlotStage;
      setIsPlotStage(itemIsPlotStage);
    }

    if (state.queringPast) return;

    if (list.length >= MAX_LEN) {
      list.splice(0, Math.floor(MAX_LEN / 2));
    }
    filterMessage(item, !isFormList);
    setList((state) => state.concat(item));

    const time = setTimeout(() => {
      scrollToBottom();
      clearTimeout(time);
    }, 200);
  };

  const filterMessage = (item: any, isSocket = false) => {
    const index = list.indexOf(item);
    item.feedback = item.feedback || null;

    if (state.enteringId) {
      const idx = list.findIndex(
        (listItem) => listItem.id === state.enteringId
      );
      state.enteringId = "";
      if (idx !== -1)
        setList((state) => {
          const CopyList = [...state];
          CopyList.splice(idx, 1);
          return CopyList;
        });
    }

    if (item.type === "ENTERING") {
      state.aiThinking = true;
      state.enteringId = item.id;
    } else {
      state.aiThinking = false;
    }

    item.head = item.source === "AI" ? item.friendHead : item.memberHead;
    if (item.type === "TIMESTAMP") item.message = filterAbbrTime(item.message);

    if (item.type === "SYSTEM_NOTICE" && item.scene && isSocket) {
      state.systemTempItem = item;
      const tempArr = item.message.split("");
      const tempStr = item.message;
      item.message = "";
      const timer = setInterval(() => {
        (state.systemTempItem as Indexes).message += tempArr.shift();
        if (tempArr.length === 0) {
          clearInterval(timer);
          if (state.readyItem) {
            const id = `entering${new Date().getTime()}`;
            setList((state) =>
              state.concat({
                id,
                type: "ENTERING",
                source: "AI",
              })
            );
            setTimeout(() => {
              const idx = list.findIndex((listItem) => listItem.id === id);
              if (idx !== -1)
                setList((state) => {
                  const CopyList = [...state];
                  CopyList.splice(idx, 1);
                  return CopyList;
                });
              onSocketMessage(state.readyItem);
              if (!state.afterSysNotice) {
                setTimeout(() => {
                  state.afterSysNotice = true;
                }, 800);
              }
            }, 500);
          }
        } else if (!detail.scene) {
          item.message = tempStr;
          clearInterval(timer);
          if (state.readyItem) {
            onSocketMessage(state.readyItem);
            if (!state.afterSysNotice) state.afterSysNotice = true;
          }
        }
      }, 20);
    }

    if (
      item.message &&
      ["TEXT", "ACTION", "REQUEST", "HOT_DATE", "ROLE_PLAY"].includes(item.type)
    ) {
      const str = `<text>${item.message}</text>`;
      item.message = str.replace(/\*(.*?)\*/g, "<b><i>*$1*</i></b>");
    }

    if (!item.extObj) return;

    const extObj = JSON.parse(item.extObj);

    switch (item.type) {
      case "VIDEO":
        item.coverUrl = filterImage(extObj.coverUrl);
        item.videoUrl = filterImage(extObj.videoUrl);
        break;
      case "VOICE":
        item.voiceUrl = filterImage(extObj.voiceUrl);
        item.playing = false;
        item.voiceDuration = extObj.voiceDuration || 0;
        item.voiveProgress = 0;
        break;
      case "IMG":
        item.imageUrl = filterImage(extObj.imageUrl);
        item.imageId = extObj.friendTrackId;
        item.resourceType = extObj.resourceType;
        item.isUnderwearUnlocked = !!extObj.isUnderwearUnlocked;
        break;
      case "ASMR":
        item.asmrUrl = filterImage(extObj.asmrUrl);
        break;
      default:
        break;
    }

    setList((state) => {
      const CopyList = [...state];
      CopyList[index] = item;
      return CopyList;
    });
  };

  const clearRecord = () => {
    if (!state.recorderManager) return;

    (state.recorderManager as Indexes)?.stream
      ?.getTracks?.()
      .forEach((track: any) => {
        track.stop();
      });

    state.recorderManager = null;
  };

  const doUndress = () => {
    if (checkEntering()) return;
    const item = state.needUpdateImg as Indexes;
    item.isUnderwearUnlocked = true;
    state.entering = true;
    fetchRequest("/restApi/chatMessage/getUnderwearPhoto", {
      reflectId: item.id,
      message: t("chat.undressForMe"),
      friendId: state.friendId,
    })
      .then((res) => {
        if (res.code === 1001) {
          onUnlock("unlock_Undress_chat");
          item.isUnderwearUnlocked = false;
          // TODO
          // cusPhotoRef.value.close()
        } else {
          item.isUnderwearUnlocked = true;
          const { url = "" } = res.result;
          if (url) {
            // TODO
            // cusPhotoRef.value.update(filterImage(url))
          } else {
            toast.warning(`${t("photo.goingToTake")}...`);
            // TODO
            // cusPhotoRef.value.close()
          }
        }
      })
      .catch(() => {
        item.isUnderwearUnlocked = false;
        // TODO
        // cusPhotoRef.value.close();
      })
      .finally(() => {
        state.entering = false;
      });
  };

  const getPast = () => {
    const { timestamp, id } = list[0] || {};
    if (!id) return;
    if (id === state.firstId) return;
    if (detail.scene && curSceneStartT >= timestamp) return;

    setLoading(true);
    state.queringPast = true;
    state.listLoading = true;
    fetchRequest("/restApi/chatMessage/list", {
      pageSize: 10,
      friendId: state.friendId,
      lastMessageId: id,
    })
      .then((res) => {
        const { rows } = res.result;
        if (!rows.length) {
          state.firstId = id;
        }
        rows.forEach((item: any) => {
          const { length } = list;
          if (length >= MAX_LEN) {
            const startIdx = length - Math.floor(MAX_LEN / 2);

            setList((state) => {
              const CopyList = [...state];
              CopyList.splice(startIdx);
              return CopyList;
            });
          }
          setTimeout(() => {
            filterMessage(item);

            setList((state) => {
              const CopyList = [...state];
              CopyList.unshift(item);
              return CopyList;
            });
          }, 50);
        });
      })
      .finally(() => {
        setLoading(false);
        state.listLoading = false;
      });
  };

  const scrolltolower = () => {
    debounce(() => {
      if (!state.queringPast) return;
      state.queringPast = false;
      getList();
    }, 100);
  };

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;

    if (scrollTop === 0 && !state.listLoading) {
      getPast();
    }
    if (
      scrollTop + clientHeight >= scrollHeight - 1 &&
      scrollTop > state.lastScrollTop
    ) {
      scrolltolower();
    }
    state.lastScrollTop = scrollTop;
  };

  const hideChatLoading = () => {
    if (list.length) setLoading(false);
  };

  const onUnlockVueClose = () => {
    if (unlockType === "closer-msg") {
      toast(
        `${t("chat.youHave")} ${userState.notPremiumSentMessageCount} ${t(
          "chat.freeMessages"
        )}`
      );
    }
  };

  const sendMsgSuc = (type?: unknown) => {
    if (type === "message") {
      setMessage("");
      if (isPlotStage) {
        setIsPlotStage(false);
        setSceneBtns((state) => {
          const CopySceneBtns = [...state];
          CopySceneBtns.splice(0);
          return CopySceneBtns;
        });
      }
    } else if (type === "scene") {
      setSceneBtns((state) => {
        const CopySceneBtns = [...state];
        CopySceneBtns.forEach((item) => {
          item.disabled = true;
        });
        return CopySceneBtns;
      });
    }

    revokeObjectURL();
  };

  const handlePraise = (item: any, val: string | null) => {
    const index = list.findIndex((l) => l.id == item.id);

    setList((state) => {
      const CopyList = [...state];
      CopyList[index].feedback = val;
      return CopyList;
    });
    fetchRequest("/restApi/chatMessage/feedback", {
      id: item.id,
      feedback: val,
    });
  };

  const sendMsgFail = () => {
    revokeObjectURL();
    toast.warning(`${t("chat.waitingForConnection")}...`);
    state.entering = false;
    state.aiThinking = false;

    setTimeout(() => {
      getList();
    }, 500);
  };

  const getActions = () => {
    fetchRequest(
      `/restApi/friendAction/girlfriendActionList?reviewVersion=${AppConfigEnv.APPVERSIONCODE}&type=${AppConfigEnv.APPTYPE}`,
      {},
      {
        method: "GET",
      }
    ).then(({ result }) => {
      if (Array.isArray(result)) {
        setActions(
          result.map(
            (item) =>
              ({
                ...item,
                url: filterImage(item.expression2),
                name: item.action,
              } as never)
          )
        );
      }
    });
  };

  const checkEntering = () => {
    if (!Cookies.get("token")) {
      logout();
      return false;
    }

    const err = t("chat.holdYourHorses");
    if (!state.afterSysNotice) {
      toast.warning(err);
      return true;
    }

    if (Chat.current?.socket?.readyState !== 1) {
      state.entering = false;
      state.aiThinking = false;
      toast.warning(t("chat.waitingForConnection"));
      console.log("客户端发送失败，重置重连", Chat.current);

      Chat.current?.reconnect(true);
      return true;
    }

    if (state.entering || state.aiThinking) {
      toast.warning(err);
      return true;
    }

    return false;
  };

  const revokeObjectURL = () => {
    URL.revokeObjectURL(readyVoice as string);
    URL.revokeObjectURL(state.readyVoice as string);
    state.readyVoice = null;
    setReadyVoice(null);
  };

  const sendMsg = (fileExtension?: any) => {
    if (checkEntering()) return;

    let copyMessage = message;
    if (copyMessage) {
      copyMessage = copyMessage.trim();
      setMessage(copyMessage);
    }

    if (!copyMessage && !state.readyVoice) return;

    state.entering = true;

    state.lastMsgType = "closer-msg";

    if (state.readyVoice) {
      setLoading(true);
      uploadFile(state.readyVoice as Blob, fileExtension)
        .then((res) => {
          Chat.current?.sendMsg(
            JSON.stringify({
              friendId: state.friendId,
              type: "VOICE",
              message: res,
              source: "MEMBER",
              handlerType: "VOICE_CHAT",
              isPlotStage: sceneBtnsVisible,
              extObj: { voiceDuration: state.recordLength },
            }),
            "message"
          );
        })
        .finally(() => {
          revokeObjectURL();
          setLoading(false);
        });
    } else {
      Chat.current?.sendMsg(
        JSON.stringify({
          friendId: state.friendId,
          type: "TEXT",
          message: message,
          source: "MEMBER",
          handlerType: "CHAT",
          isPlotStage: sceneBtnsVisible,
        }),
        "message"
      );
    }
  };

  const initGirlAndChat = () => {
    getDetail();
    Chat.current.connect(state.friendId);
  };

  const createFriend = (id: string) => {
    fetchRequest(
      `/restApi/friendStyle/random?reviewVersion=${AppConfigEnv.APPVERSIONCODE}&type=${AppConfigEnv.APPTYPE}`,
      {
        styleId: id,
      }
    ).then((res) => {
      if (res.code === 1001) {
        setLoading(false);
        onUnlock("unlock_girl");
        return;
      }
      state.friendId = res.result.id;
      initGirlAndChat();
    });
  };

  const getDetailBySn = (sn: string) => {
    setLoading(true);
    fetchRequest(`/restApi/friendStyle/detailBySn/${sn}`).then(({ result }) => {
      console.log(result, "result");

      const { hide, id } = result;
      if (Boolean(hide)) {
        createFriend(id);
      } else {
        setLoading(false);
        toast.warning(t("homePage.delete"));
        setTimeout(() => {
          if (window.history.state.back) {
            router.back();
          } else {
            router.push("/");
          }
        }, 800);
      }
    });
  };

  const getDetailByStyle = (id: string) => {
    setLoading(true);
    fetchRequest(`/restApi/friendStyle/auth/detail/${id}`).then(
      ({ result }) => {
        console.log(result, "result");
        const { adultSwitch, plot, head, styleType, greeting } = result;
        setIsNSFW(adultSwitch === 1);
        setDetail(result || {});
        initAudio();
        // setBg(sceneDetail?.imageUrl || (styleType !== 'USER' && head) || '');

        if (Cookies.get("token")) {
          createFriend(id);
        } else {
          _plot.current = JSON.parse(plot);
          handAiReply(0);
          setIsPlotStage(true);
        }

        // getList();
        // initAudio();
      }
    );
  };

  /**
   * 手动控制回复主要用于，未登录情况下进行剧本聊天
   */
  const handAiReply = (index: number) => {
    plotIndex.current = index;
    const data = _plot.current[index];
    onSocketMessage({
      data: JSON.stringify({
        message: data.content,
        source: "AI",
        id: index,
        timestamp: String(Date.now()),
        type: data.type,
        isPlotStage: true,
        plotRound: 1,
        extObj: JSON.stringify({
          plotReplies: data.replies,
        }),
      }),
    });

    if (data.attachment.length) {
      data.attachment.forEach((item: any, index: string) => {
        onSocketMessage({
          data: JSON.stringify({
            message: item.content,
            source: "AI",
            id: index + "-" + index,
            timestamp: String(Date.now()),
            type: item.type,
            extObj: JSON.stringify({
              videoUrl: item.content,
              coverUrl: item.cover || item.content,
              voiceUrl: item.content,
              voiceDuration: item.voiceDuration,
              imageUrl: item.content,
              friendTrackId: item.friendTrackId,
              resourceType: item.resourceType,
              handSwitch: false,
            }),
          }),
        });
      });
    }
  };

  useBusWatch("hideLoading", hideChatLoading);
  useBusWatch("sendMsgSuc", sendMsgSuc);
  useBusWatch("sendMsgFail", sendMsgFail);
  useBusWatch("onSocketMessage", onSocketMessage);
  useBusWatch("setName", (e: unknown) => {
    setDetail((state) => {
      return { ...state, name: e };
    });
  });

  useEffect(() => {
    const { friendId, sn, m, orderNum, payType, styleId } = {
      payType: searchParams.get("payType"),
      orderNum: searchParams.get("t"),
      friendId: searchParams.get("friendId"),
      sn: searchParams.get("sn"),
      m: searchParams.get("m"),
      styleId: searchParams.get("styleId"),
    };

    if (orderNum && localStorage.getItem("order") !== orderNum) {
      localStorage.setItem("order", orderNum);
      setTimeout(() => {
        fbq("track", "Purchase", {
          value: m,
          currency: "USD",
          payType: payType === "1" ? "stripe" : "vpay6",
        });
      }, 1000);
    }

    state.friendId = friendId!;

    if (Cookies.get("token")) {
      getActions();
    }

    /**
     * 使 IOS 端一开始就滚动到底部
     */
    window.scrollTo(0, 200);

    if (friendId) {
      cDebounce(
        () => {
          initGirlAndChat();
        },
        300,
        [],
        false
      );
    } else if (sn) {
      getDetailBySn(sn);
    } else if (styleId) {
      getDetailByStyle(styleId);
      // window.scrollTo(0, 0);
    }

    return () => {
      clearFun();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Chat.current?.close();
      clearRecord();
      destroyAudio("clear");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Cookies.get("token")) {
      getTools();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userState.hasEnterNewChatPage, systemState.isFull]);

  let recordListLength = useRef(0);

  useEffect(() => {
    if (recordListLength.current < list.length) {
      scrollToBottom();
    }
    recordListLength.current = list.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  return (
    <div className="full-page flex flex-col h-[100vh] bg-slate-50">
      <ChatContext.Provider
        value={{
          t,
          state,
          userState: userState,
          system: systemState,
          sceneBtnsVisible,
          toolsVisible,
          detail,
          setDetail,
          bg,
          setBg,
          focus,
          setFocus,
          isTransparent,
          setIsTransparent,
          isNSFW,
          setIsNSFW,
          list,
          setList,
          sceneBtns,
          setSceneBtns,
          isPress,
          setIsPress,
          isPlotStage,
          setIsPlotStage,
          unlockDialogVisible,
          setUnlockDialogVisible,
          afterSysNotice,
          setAfterSysNotice,
          loading,
          setLoading,
          readyVoice,
          setReadyVoice,
          message,
          setMessage,
          guideStep,
          setGuideStep,
          tools,
          setTools,
          actions,
          setActions,
          unlockType,
          setUnlockType,
          curSceneStartT,
          actionsVisible,
          setActionsVisible,
          setCurSceneStartT,
          recordLength,
          setRecordLength,
          setVideoVisible,
          setVideoData,
          clearRecord,
          sendPreinstall,
          dir: dir(lng),
        }}
      >
        <ClientBg></ClientBg>

        <div className="">
          <ClientHead onUnlock={onUnlock}></ClientHead>

          <div className="h-11 w-full"></div>

          {/* <div
            className={cn(
              'opacity-0 fixed z-20 top-11 w-full h-5 bg-[#181425]',
              detail.styleType === 'USER' ? 'opacity-0' : ''
            )}
          ></div> */}
        </div>

        <div className={cn("overflow-hidden flex-1 flex flex-col relative")}>
          <ScrollView onScroll={onScroll} scrollDom={scrollDom}>
            {list.map((item) => (
              <div key={item.id} className="list__item">
                {["TIMESTAMP", "SYSTEM_NOTICE"].includes(item.type) &&
                !(detail.scene && item.timestamp < curSceneStartT) ? (
                  // 系统通知
                  <SystemRecord item={item}></SystemRecord>
                ) : !(detail.scene && item.timestamp < curSceneStartT) ? (
                  // 聊天记录
                  <div
                    className={cn(
                      "item--member flex mb-6 group",
                      item.source !== "AI" ? "self flex-row-reverse" : "",
                      ["VIDEO", "IMG", "VOICE"].includes(item.type)
                        ? "no-angle [&_.bubble-footer]:hidden"
                        : ""
                    )}
                  >
                    <div className="item__container relative text-[17px] leading-[22px] -tracking-[0.5px]">
                      <BubbleFooter item={item}></BubbleFooter>

                      {/* <!-- 纯文本 --> */}
                      {[
                        "TEXT",
                        "ACTION",
                        "REQUEST",
                        "HOT_DATE",
                        "ROLE_PLAY",
                      ].includes(item.type) && (
                        <div className="item__container--text relative z-[1] text-slate-800">
                          {item.gptModeration &&
                          userState.premiumStatus === "NONE" ? (
                            <TextRecord.TextNoPremium
                              item={item}
                              onUnlock={onUnlock}
                              t={t}
                            ></TextRecord.TextNoPremium>
                          ) : newestId === item.id &&
                            ["TEXT", "HOT_DATE", "ROLE_PLAY"].includes(
                              item.type
                            ) &&
                            item.source === "AI" ? (
                            <TextRecord.TextAI
                              item={item}
                              handlePraise={handlePraise}
                            ></TextRecord.TextAI>
                          ) : (
                            <TextRecord.TextMe item={item}></TextRecord.TextMe>
                          )}
                        </div>
                      )}

                      {/* asmr */}
                      {item.type === "ASMR" && (
                        <AsmrRecord
                          item={item}
                          onUnlock={onUnlock}
                        ></AsmrRecord>
                      )}

                      {/* 语音 */}
                      {item.type === "VOICE" && (
                        <AudioRecord
                          item={item}
                          destroyAudio={destroyAudio}
                        ></AudioRecord>
                      )}

                      {/* 视频图片 */}
                      {["VIDEO", "IMG"].includes(item.type) && (
                        <ImageVideoRecorder
                          item={item}
                          onUnlock={onUnlock}
                          doUndress={doUndress}
                        ></ImageVideoRecorder>
                      )}

                      {/* 排队 */}
                      {(item.type === "ENTERING" ||
                        item.type === "QUEUE_UP") && (
                        <AwaitRecord></AwaitRecord>
                      )}
                    </div>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            ))}
          </ScrollView>

          <ClientSendMsg
            revokeObjectURL={revokeObjectURL}
            onUnlock={onUnlock}
            sendMsg={sendMsg}
            destroyAudio={destroyAudio}
            checkEntering={checkEntering}
          ></ClientSendMsg>
        </div>

        <Unlock
          visible={unlockDialogVisible}
          setVisible={setUnlockDialogVisible}
          type={unlockType}
          confirm={onUnlock}
          close={onUnlockVueClose}
        ></Unlock>

        <VideoDialog
          visible={videoVisible}
          setVisible={setVideoVisible}
          {...videoData}
        ></VideoDialog>

        {/* <Action
          actions={actions}
          onUnlock={onUnlock}
          checkEntering={checkEntering}
        ></Action> */}
      </ChatContext.Provider>
    </div>
  );
}
