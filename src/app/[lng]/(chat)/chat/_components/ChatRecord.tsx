"use client";

import { cn } from "@/lib/utils";
import { TFunction } from "i18next";
import Image from "next/image";
import { FC, SyntheticEvent, useContext } from "react";
import { ChatContext } from "./Client";
import { useRouter } from "next/navigation";
import { debounce } from "@/utils/debounce-throttle";
import { filterImage, logout } from "@/utils/business";
import emitter from "@/utils/bus";
import { toast } from "sonner";
import Cookies from "js-cookie";

type Record<T = any> = FC<
  {
    item: any;
  } & T
>;

const ClassName = {
  text__inner:
    "text__inner px-3 py-2 max-w-72 min-w-14 min-h-9 rounded-2xl bg-[#e9e9eb] break-words whitespace-pre-wrap",
};

// 时间, 通知
export const SystemRecord: Record = ({ item }) => {
  return (
    <div
      className={cn(
        "item--info text-sm text-[#ebebf5] text-center mb-3 whitespace-pre-wrap",
        !!item.scene && item.type !== "TIMESTAMP" ? "scene" : ""
      )}
    >
      {item.message}
    </div>
  );
};

type TextRecord = {
  TextMe: Record;
  TextAI: FC<{
    item: any;
    handlePraise: (item: any, val: string | null) => void;
  }>;
  TextNoPremium: FC<{
    item: any;
    t: TFunction<"translation", undefined>;
    onUnlock: (val: string) => void;
  }>;
};
// 文本类型记录
export const TextRecord: TextRecord = {
  // me
  TextMe: ({ item }) => {
    const ctx = useContext(ChatContext);
    return (
      <div
        className={cn(
          "text__inner group-[.self]:bg-[#3f3b52] group-[.self]:text-white",
          ClassName.text__inner,
          item.type === "HOT_DATE" ? "hot-date text-white" : "",
          item.type === "ROLE_PLAY" ? "role-play text-white" : ""
        )}
        style={{
          backgroundImage: (
            {
              HOT_DATE: "linear-gradient(to right, #ff8f4f 0%, #ec52d4 100%)",
              ROLE_PLAY: "linear-gradient(to right, #ff8f4f 0%, #ec52d4 100%)",
            } as Indexes
          )[item.type],
        }}
        dir={ctx.dir}
        dangerouslySetInnerHTML={{ __html: item.message }}
      />
    );
  },

  // AI
  TextAI: ({ item, handlePraise }) => {
    const ctx = useContext(ChatContext);
    return (
      <div className="text__latest flex items-center" dir="ltr">
        <div
          className={cn(
            ClassName.text__inner,
            "text__inner relative max-w-64",
            item.type === "HOT_DATE" ? "hot-date" : "",
            item.type === "ROLE_PLAY" ? "role-play" : ""
          )}
          dir={ctx.dir}
          dangerouslySetInnerHTML={{ __html: item.message }}
        />
        {typeof item.feedback !== "undefined" && !item.feedback && (
          <div className="edit-praise flex items-center ml-3">
            <Image
              className="rounded-full flex justify-center items-center w-8 h-8 bg-[#474459]"
              width={28}
              height={28}
              src="/icons/praise.png"
              alt="praise"
              onClick={() => {
                handlePraise(item, "LIKE");
              }}
            />
            <Image
              width={28}
              height={28}
              className="rounded-full flex justify-center items-center w-8 h-8 bg-[#474459] ml-3"
              src="/icons/no-praise.png"
              alt="no-praise"
              onClick={() => {
                handlePraise(item, "DISLIKE");
              }}
            />
          </div>
        )}
        {["LIKE", "DISLIKE"].includes(item.feedback) && (
          <div className="fixed-btn absolute -right-3 bottom-0 bg-white flex justify-center items-center w-8 h-8 rounded-full">
            {item.feedback === "LIKE" && (
              <Image
                width={28}
                height={28}
                className="rounded-full"
                src="/icons/praise.png"
                alt="praise"
                onClick={() => handlePraise(item, null)}
              />
            )}
            {item.feedback === "DISLIKE" && (
              <Image
                width={28}
                height={28}
                className="rounded-full"
                src="/icons/no-praise.png"
                alt="no-praise"
                onClick={() => handlePraise(item, null)}
              />
            )}
          </div>
        )}
      </div>
    );
  },

  // 未开通会员
  TextNoPremium: ({ item, onUnlock, t }) => {
    return (
      <div className="text__unlock flex items-center">
        <span className="px-3 py-[6px] w-40 rounded-xl bg-[#e9e9eb] text-xs leading-[22px] break-words">
          ************************************
        </span>
        <div
          className="fixed-right flex items-center"
          onClick={(e) => {
            e.preventDefault();
            onUnlock(
              item.gptModeration === 1
                ? "unlock-private-text"
                : "unlock-sensitive-text"
            );
          }}
        >
          <div className="lock ml-3">
            <Image width={20} height={20} src="/icons/lock.png" alt="lock" />
          </div>

          <div
            className="btn flex items-center ml-3 justify-center w-28 h-10 rounded-full text-lg text-white"
            style={{
              background: "linear-gradient(to right, #7e78e4 0%, #9e6ed1 100%)",
            }}
            onClick={() => [
              onUnlock(
                item.gptModeration === 1
                  ? "unlock-private-text"
                  : "unlock-sensitive-text"
              ),
            ]}
          >
            <Image
              className="love-lock ml-[2px] w-6"
              alt="love lock"
              width={24}
              height={24}
              src="/icons/love-lock.png"
            />
            {t("chat.unlock")}
          </div>
        </div>
      </div>
    );
  },
};

// ASMR
export const AsmrRecord: Record<{
  onUnlock: (source: string) => void;
}> = ({ item, onUnlock }) => {
  const state = useContext(ChatContext);
  const router = useRouter();

  const goToASMR = () => {
    toast("coming soon");
    return;
    const { asmrUrl, id, message } = item;
    const { premiumStatus } = state.userState!;
    if (premiumStatus === "NONE") {
      onUnlock("unlock_asmr");
      return;
    }
    const { animationHead, name, head } = state.detail!;
    const queryForm = {
      id,
      name,
      animationHead: animationHead || head,
      asmrUrl,
      asmrName: message,
    };

    router.push(
      `/asmr?queryForm=${encodeURIComponent(JSON.stringify(queryForm))}`
    );
  };

  return (
    <div
      className="item__container--text relative z-[1] text-black"
      onClick={() => {
        goToASMR();
      }}
    >
      <div
        className={cn(
          "text__inner asmr flex items-center relative",
          ClassName.text__inner
        )}
        style={{
          backgroundImage:
            "linear-gradient(41deg, #8d7adb 0%, #e6a0cc 32%, #6e91ea 71%, #b5e1f8 100%), linear-gradient(53deg, rgba(140, 117, 217, 0.51) 3%, rgba(140, 117, 217, 0) 100%)",
        }}
      >
        <Image
          className="wave absolute top-2/4 right-0 -translate-y-2/4"
          width={137}
          height={41}
          src="/images/asmr-wave-chat.png"
          alt="wave"
        />
        <Image
          className="enter-icon mr-2"
          width={22}
          height={22}
          src="/icons/enter.png"
          alt="enter"
        />
        <div className="asmr-name required: z-10 flex-1 text-white">
          {item.message}
        </div>
      </div>
    </div>
  );
};

// 音频
export const AudioRecord: Record<{
  destroyAudio: () => void;
}> = ({ item, destroyAudio }) => {
  const ctx = useContext(ChatContext);
  const filterDuration = (num: number) => {
    if (!num) return "0:00";
    const h = parseInt(String(num / 60), 10);
    const s = `${Math.round(num % 60)}`.padStart(2, "0");
    return `${h}:${s}`;
  };

  const playVoice = () => {
    debounce(() => {
      const { id, playing, voiceUrl } = item;

      if (!voiceUrl) {
        toast("Play failure");
        return;
      }

      if (ctx.state?.currentAudioItem?.id !== id) {
        destroyAudio();
        ctx.state!.currentAudioItem = item;
        ctx.setLoading?.(true);
        emitter.emit("setGlobalLoading", true);

        ctx.state!.audioContext!.src = voiceUrl;
        ctx.state!.audioContext!.load();
      }
      if (playing) {
        ctx.state!.audioContext!.pause();
        // setTimeout(() => {
        //   ctx.state!.audioContext!.playing = false;
        // }, 50);
        ctx.setLoading?.(false);
        emitter.emit("setGlobalLoading", false);
      } else if (ctx.state?.audioContext?.readyState >= 3) {
        ctx.state?.audioContext?.play();
      } else {
        ctx.state?.audioContext?.addEventListener(
          "canplay",
          () => {
            ctx.setLoading?.(false);
            emitter.emit("setGlobalLoading", false);
            ctx.state?.audioContext?.play();
          },
          { once: true }
        );
      }

      ctx.setList?.((l) => {
        const CopyList = [...l];
        const index = l.findIndex(
          (i) => i.id === ctx.state!.currentAudioItem.id
        );
        if (index >= 0) {
          CopyList[index] = ctx.state!.currentAudioItem;
        }

        return CopyList;
      });
    });
  };

  return (
    <div
      className="item__container--voice flex items-center w-[170px] h-14 border border-[#8c8c8c] rounded-2xl"
      style={{
        background: "rgba(98, 94, 111, 0.6)",
      }}
      onClick={() => {
        playVoice();
      }}
    >
      <div className="icons ml-3 relative w-8 h-8">
        <Image
          width={32}
          height={32}
          src="/icons/pause.png"
          alt="pause"
          className={cn(
            "absolute left-0 top-0",
            item.playing ? "z-10 opacity-100" : "z-0 opacity-0"
          )}
        />
        <Image
          width={32}
          height={32}
          src="/icons/play.png"
          alt="play"
          className={cn(
            "absolute left-0 top-0",
            !item.playing ? "z-10 opacity-100" : "z-0 opacity-0"
          )}
        />
      </div>
      <div className="progress flex items-center my-0 mx-2">
        {new Array(9).fill(1).map((each, index) => (
          <div
            className={cn(
              "progress__line h-4 w-[3px] mr-1 rounded",
              "first-of-type:h-2 [&:nth-of-type(9)]:h-2 [&:nth-of-type(5)]:h-2 [&:nth-of-type(3)]:h-[26px] [&:nth-of-type(7)]:h-[26px]"
            )}
            style={{
              background:
                Number(item.voiveProgress) > index
                  ? "linear-gradient(to right, #7e78e4 0%, #9e6ed1 100%)"
                  : "white",
            }}
            key={index}
          ></div>
        ))}
      </div>
      <div className="time">{filterDuration(item.voiceDuration)}</div>
    </div>
  );
};

export const ImageVideoRecorder: Record<{
  onUnlock: (source: string) => void;
  doUndress: () => void;
}> = ({ item, onUnlock, doUndress }) => {
  const ctx = useContext(ChatContext);
  const router = useRouter();
  const onImgLoad = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const index = ctx.list?.indexOf(item);
    item.loaded = true;
    ctx.setList?.((state) => {
      const CopyList = [...state];
      CopyList[index!].loaded = true;

      return CopyList;
    });
  };

  const openCreateVideo = (key?: string) => {
    debounce(
      () => {
        const { premiumStatus } = ctx.userState!;
        if (item.type === "VIDEO") {
          if (!Cookies.get("token")) {
            logout();
            return;
          }

          if (premiumStatus === "NONE") {
            onUnlock("unlock_Video");
            return;
          }

          ctx.setVideoData?.({
            videoUrl: item.videoUrl,
            poster: item.coverUrl,
          });
          ctx.setVideoVisible?.(true);
        } else if (key !== "undress") {
          const needUndress =
            item.resourceType === "IMAGE_NORAL" && !item.isUnderwearUnlocked;
          if (needUndress) {
            ctx.state!.needUpdateImg = item;
          }
          let query = `friendId=${ctx.state!.friendId}&url=${
            item.imageUrl
          }&needUndress=${needUndress}&chatId=${item.id}`;
          if (ctx.detail?.name !== ctx.detail?.friendStyleName)
            query += `&name=${ctx.detail?.name}`;
          router.push(`/photo?${query}`);
        } else if (premiumStatus === "NONE") {
          onUnlock("unlock_Undress_chat");
        } else {
          ctx.state!.needUpdateImg = item;
          doUndress();
        }
      },
      300,
      [key]
    );
  };

  return (
    <div className="item__container--video">
      <div className="video-wrapper">
        {item.type === "IMG" ? (
          <Image
            className="cover-img rounded-2xl"
            width={171}
            height={256}
            alt=""
            src={filterImage(item.imageUrl)}
            onLoad={(e) => onImgLoad(e)}
          />
        ) : (
          <Image
            className="cover-video rounded-2xl"
            width={171}
            height={171}
            src={filterImage(item.coverUrl)}
            onLoad={(e) => onImgLoad(e)}
            alt=""
          />
        )}

        <div
          className={cn(
            "mask absolute left-0 top-0 size-full rounded-2xl",
            ctx.userState?.premiumStatus === "NONE" && item.type !== "IMG"
              ? "filter backdrop-blur-xl"
              : ""
          )}
          onClick={() => {
            openCreateVideo();
          }}
        >
          {item.type !== "IMG" && item.loaded && (
            <Image
              className="icon absolute top-2/4 left-16 -translate-y-2/4"
              width={40}
              height={40}
              alt=""
              src="/icons/play-white.png"
            ></Image>
          )}

          {(ctx.userState?.premiumStatus === "NONE" && item.type === "VIDEO") ||
          (item.type === "IMG" &&
            item.resourceType === "IMAGE_NORAL" &&
            !item.isUnderwearUnlocked &&
            ctx.system?.isFull) ? (
            <div
              className={`fixed-right hidden absolute top-2/4 right-0 translate-x-full -translate-y-2/4 items-center ${
                (ctx.userState?.premiumStatus === "NONE" &&
                  item.type === "VIDEO") ||
                (item.type === "IMG" &&
                  item.resourceType === "IMAGE_NORAL" &&
                  !item.isUnderwearUnlocked &&
                  ctx.system?.isFull)
                  ? "show !flex"
                  : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                openCreateVideo("undress");
              }}
            >
              {item.type !== "IMG" && (
                <Image
                  className="lock ml-2"
                  width={20}
                  height={20}
                  src="/icons/lock.png"
                  alt=""
                />
              )}

              <div
                className={`btn ml-3 flex justify-center items-center pl-1 pr-3 min-w-28 h-10 rounded-[52px] text-lg tracking-[-0.5px] text-white ${
                  item.type === "IMG" ? "undress" : ""
                }`}
                style={{
                  background:
                    item.type === "IMG"
                      ? "linear-gradient(to right, #ff8f4f 0%, #ec52d4 100%)"
                      : "linear-gradient(to right, #7e78e4 0%, #9e6ed1 100%)",
                }}
              >
                {item.type !== "IMG" ? (
                  <Image
                    className="love-lock mr-[2px]"
                    width={24}
                    height={24}
                    alt="love lock"
                    src="/icons/love-lock.png"
                  />
                ) : (
                  <Image
                    className="love-lock mr-[2px]"
                    width={24}
                    height={24}
                    alt=""
                    src="/icons/permit-18.png"
                  />
                )}
                {item.type === "IMG"
                  ? ctx.t!("chat.undress")
                  : ctx.t!("chat.unlock")}
              </div>
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
};

// 排队
export const AwaitRecord: FC = () => {
  return (
    <div className="item__container--text relative z-[1] text-black">
      <div
        className={cn("text__inner flex items-center", ClassName.text__inner)}
      >
        <Image
          className="loading-icon"
          src="/gifs/loading.gif"
          width={26}
          height={14}
          unoptimized
          alt="loading"
        />
      </div>
    </div>
  );
};

// 角标
export const BubbleFooter: Record = ({ item }) => {
  const bubbleLeftProp = {
    className:
      "bubble-footer bubble-footer--left absolute bottom-0 left-[-5px] group-[.self]:hidden",
    width: 17,
    height: 22,
  };
  return (
    <>
      {item.type === "ASMR" ? (
        <Image
          {...bubbleLeftProp}
          alt=""
          src="/icons/bubble-footer-left-asmr.png"
        />
      ) : item.type === "HOT_DATE" ? (
        <Image
          {...bubbleLeftProp}
          alt=""
          src="/icons/bubble-footer-left-hot-date.png"
        />
      ) : item.type === "ROLE_PLAY" ? (
        <Image
          {...bubbleLeftProp}
          alt=""
          src="/icons/bubble-footer-left-role-play.png"
        />
      ) : (
        <Image {...bubbleLeftProp} alt="" src="/icons/bubble-footer-left.png" />
      )}

      <Image
        alt=""
        width={17}
        height={22}
        className="group-[.self]:block group-[.no-angle]:!hidden bubble-footer bubble-footer--right absolute bottom-0 hidden left-[unset] right-[-5px]"
        src="/icons/bubble-footer-right.png"
      />
    </>
  );
};
