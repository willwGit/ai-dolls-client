/* eslint-disable @next/next/no-img-element */
"use client";
import { Empty, ExploresList } from "@/components/ExploresList";
import { Slogans } from "@/components/Slogans";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUserStore } from "@/hooks/use-user";
import { AppConfigEnv, cn } from "@/lib/utils";
import { useTranslation } from "@/locales/client";
import emitter from "@/utils/bus";
import { filterImage, filterPopularity } from "@/utils/business";
import { debounce } from "@/utils/debounce-throttle";
import { fetchRequest } from "@/utils/request";
import { copyText } from "@/utils/string-transform";
import Cookies from "js-cookie";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const popularOrder = "sort is null, coalesce(sort, -popularity)";
const recentOrder = "id";
const query = {
  pageSize: 10,
  pageNo: 0,
  orderBy: popularOrder,
  sort: "",
};

export default function AccordionDemo() {
  const { t } = useTranslation();
  const router = useRouter();
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [catchErr, setCatchErr] = useState(false);
  const [filterType, setFilterType] = useState("popular");
  const [popupVisible, setPopupVisible] = useState(false);
  const [styleDetail, setStyleDetail] = useState<Indexes>({});

  const searchParams = useSearchParams();

  const checkClipboardData = () => {
    navigator.clipboard
      ?.readText?.()
      .then((data) => {
        if (data) {
          const snRegex = /(sexy\d{5,})$/;
          const uidRegex = /uid=(\d+)&/;
          const snMatch = data.match(snRegex);
          const uidMatch = data.match(uidRegex);
          const sn = snMatch ? snMatch[1] : null;
          const uid = uidMatch ? uidMatch[1] : null;
          if (sn) {
            const localSn = localStorage.getItem("shareSn");
            if (localSn === sn) return;
            getDetailBySn(sn, uid);
          }
        }
      })
      .catch(() => {
        // if (!tryCheckClipboardData) this.checkClipboardData()
        // this.tryCheckClipboardData = true
      });
  };

  const getDetailBySn = (sn: string, uid: string | null) => {
    fetchRequest(`/restApi/friendStyle/detailBySn/${sn}`).then(({ result }) => {
      copyText("", () => {}, false);
      const { hide } = result;
      if (hide) {
        const styleDetail = result || {};
        if (uid) {
          fetchRequest(`/restApi/member/info/${uid}`)
            .then(({ result }) => {
              const { nickName, head, id } = result;
              styleDetail.userAvater = head;
              styleDetail.userName = nickName;
              styleDetail.uid = id;
              setStyleDetail(styleDetail);
              openPopup();
            })
            .catch(() => {
              setStyleDetail(styleDetail);
              openPopup();
            });
        } else {
          setStyleDetail(styleDetail);
          openPopup();
        }
      } else {
        toast(t("homePage.delete"));
      }
    });
  };

  const openPopup = () => {
    setPopupVisible(true);
  };

  const closePopup = () => {
    setPopupVisible(false);
  };

  const createFriendBystyle = () => {
    closePopup();
    const type = "H5";
    fetchRequest(
      `/restApi/friendStyle/random?reviewVersion=${AppConfigEnv.APPVERSIONCODE}&type=${AppConfigEnv.APPTYPE}`,
      {
        styleId: styleDetail.id,
      }
    ).then((res) => {
      if (res.code === 1001) {
        router.push("/create-result?source=unlock_girl");
        return;
      }
      router.push(`/chat?friendId=${res.result.id}`);
    });
  };

  const goToSearch = () => {
    router.push("/search");
  };

  const onTabItem = (item: any) => {
    debounce(() => {
      // item.isClicked = true;
      // if (item.cover2) item.currentCover = item.cover2;
      // setTimeout(() => {
      // item.isClicked = false;
      const { id, name } = item;
      // if (item.type === 'PROFESSIONALLY') {
      //   router.push(`/create-options?styleId=${id}&styleByName=${name}`);
      // } else {
      if (
        Cookies.get("token") ||
        (typeof window != "undefined" &&
          origin !== "https://www.telegramloveai.com")
      ) {
        emitter.emit("setGlobalLoading", true);
        createFriend(id, name);
      } else {
        router.push(`/chat?styleId=${id}`);
      }
      // }

      //   setTimeout(() => {
      //     item.currentCover = item.cover;
      //   }, 2000);
      // }, 500);
    }, 2000);
  };

  const createFriend = (id: string, name: string) => {
    fetchRequest("/restApi/friend/generate", {
      name,
      faceId: "1",
      styleId: id,
      isExperiencePlot: true,
    })
      .then(({ code, result }) => {
        // if (code === 1001) {
        // router.replace(`/create-result?source=unlock_girl`);
        //   return;
        // }
        if (code != 200) return;

        const { name: girlName, head, id: girlId } = result;

        // if (userState.premiumStatus === 'NONE') {
        //   const friendForm = {
        //     head,
        //     name: girlName,
        //     id: girlId,
        //   };

        //   router.replace(
        //     `/create-result?creating=1&type=USER&friendForm=${encodeURIComponent(
        //       JSON.stringify(friendForm)
        //     )}`
        //   );
        // } else {
        router.push(`/chat?friendId=${girlId}`);
        emitter.emit("setGlobalLoading", false);
        // }
      })
      .catch(() => {
        emitter.emit("setGlobalLoading", false);
      });
  };

  const switchFilter = (key: string) => {
    if (key === filterType) return;

    setFilterType(key === "popular" ? "popular" : "recent");
    if (key === "popular") {
      query.orderBy = popularOrder;
      query.sort = "";
    } else {
      query.orderBy = recentOrder;
      query.sort = "desc";
    }
    resetList();
  };

  const resetList = () => {
    if (loading) return;
    setLoaded(false);
    query.pageNo = 0;
    getList();
  };

  const getList = () => {
    if (loading) return;

    // const { appVersionCode } = this.$store.state.system
    // if (!appVersionCode) {
    //   setTimeout(() => {
    //     this.resetList()
    //   }, 50)
    //   return
    // }

    const type = "H5";
    setLoading(true);

    query.pageNo += 1;

    fetchRequest(
      `/restApi/friendStyle/auth/explores?reviewVersion=${AppConfigEnv.APPVERSIONCODE}&type=${type}`,
      query
    )
      .then(({ result }) => {
        setCatchErr(false);
        const { rows, total: _total } = result;
        rows.forEach((item: any) => {
          // if (item.cover2) {
          //   const img = new Image({})
          //   img.src = filterImage(item.cover2)
          // }
          item.isClicked = false;
          item.currentCover = item.cover;
          item.processedPopularity = filterPopularity(item.popularity);
        });
        let copyList = list;
        if (query.pageNo === 1) {
          copyList = rows;
        } else {
          copyList = list.concat(rows);
        }
        setList(copyList);
        setTotal(_total);
        setLoaded(copyList.length >= _total);

        setTimeout(() => {
          setLoading(false);
        }, 100);
      })
      .catch(() => {
        setLoading(false);
        setCatchErr(true);
        setTotal(0);
      });
  };

  useEffect(() => {
    resetList();
    checkClipboardData();
    emitter.emit("initSlogans");

    let time: NodeJS.Timeout;
    const { t, m, payType } = {
      t: searchParams.get("t"),
      m: searchParams.get("m"),
      payType: searchParams.get("payType"),
    };
    if (t && localStorage.getItem("order") !== t) {
      localStorage.setItem("order", t);
      time = setTimeout(() => {
        fbq("track", "Purchase", {
          value: +m!,
          currency: "USD",
          payType: payType === "1" ? "stripe" : "vpay6",
        });
      }, 1000);
    }

    return () => {
      if (time) clearTimeout(time);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const isBottom =
        window.innerHeight + document.documentElement.scrollTop ===
        document.documentElement.scrollHeight;

      if (isBottom) {
        if (!list.length || loaded || loading) return;
        getList();
      }
    };

    // 添加滚动监听
    window.addEventListener("scroll", handleScroll);

    // 组件卸载时移除监听
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, loaded, loading]); // 空依赖数组确保事件监听只被添加和移除一次

  return (
    <div className="full-page tab-page pt-0">
      <div className="fixed z-50 flex justify-between bg-[#181425] items-center top-0 left-0 w-full py-3 px-5">
        <div className="text-2xl font-bold text-white">{t("index.title")}</div>
        <div className="flex items-center">
          <Image
            onClick={goToSearch}
            width={20}
            height={20}
            className="mx-3"
            src="/icons/search.png"
            alt=""
          />
          <div className="p-[2px] bg-white bg-opacity-10 flex items-center rounded-lg">
            <div
              className={cn(
                "text-opacity-60 p-[6px] text-xs text-white rounded-lg",
                filterType === "popular"
                  ? "bg-white bg-opacity-30 text-opacity-100"
                  : ""
              )}
              onClick={() => switchFilter("popular")}
            >
              {t("index.popular")}
            </div>
            <div
              className={cn(
                "text-opacity-60 p-[6px] text-xs text-white rounded-lg",
                filterType === "recent"
                  ? "bg-white bg-opacity-30 text-opacity-100"
                  : ""
              )}
              onClick={() => switchFilter("recent")}
            >
              {t("index.recent")}
            </div>
          </div>
        </div>
      </div>
      <div className="pt-[72px]">
        <Slogans />

        {(!total && loaded) || catchErr ? (
          <Empty
            needReload={catchErr}
            text={t("index.noMore")}
            subtext={t("index.youCanCreate")}
            emptyImageKey="index"
            reload={resetList}
          />
        ) : (
          <ExploresList
            list={list}
            loaded={loaded}
            total={total}
            isLoading={loading}
            getListEmit={getList}
            tabItemEmit={onTabItem}
          />
        )}
      </div>

      <Dialog open={popupVisible} onOpenChange={setPopupVisible}>
        <DialogContent>
          <div className="w-[90vw] p-5 box-border rounded-lg bg-[#e1e1fd]">
            {Boolean(styleDetail.uid) && (
              <div className="slot__header flex-container mb-3">
                {styleDetail.userAvater ? (
                  <Image
                    width={32}
                    height={32}
                    className="rounded-full"
                    src={filterImage(styleDetail.userAvater)}
                    alt=""
                  />
                ) : (
                  <Image
                    width={32}
                    height={32}
                    className="rounded-full mb-1"
                    src="/images/default-head.png"
                    alt=""
                  />
                )}

                <div className="text-[#625e6f]">
                  <div className="text-sm font-bold line-clamp-1">
                    {styleDetail.userName}
                  </div>
                  <div className="mt-[1px] text-xs">{t("index.shared")}</div>
                </div>
              </div>
            )}

            <img
              className="mb-4 rounded-xl w-full h-80 object-top"
              src={filterImage(styleDetail.head)}
              alt=""
            />
            <div className="slot__bottom">
              <div className="mb-2 flex items-center">
                <div className="max-w-52 font-bold text-3xl text-[#181425] line-clamp-1 mr-2">
                  {styleDetail.name}
                </div>
                <div className="flex justify-center items-center mx2 py-[1px] px-2 rounded-3xl bg-[#c2c2e0] text-sm text-[#625e6f]">
                  {styleDetail.sn}
                </div>
              </div>
              <div className="text-base line-clamp-2 text-[#625e6f]">
                {styleDetail.description}
              </div>
              <div
                className="flex justify-center items-center mt-6 mx-auto w-32 h-12 rounded-full text-lg font-bold text-white"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #736bff 0%, #e254ee 100%)",
                }}
                onClick={createFriendBystyle}
              >
                {t("index.chat")}
              </div>
            </div>
          </div>
          {/* <DialogHeader>
      <DialogTitle>Are you absolutely sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone. This will permanently delete your account
        and remove your data from our servers.
      </DialogDescription>
    </DialogHeader> */}
        </DialogContent>
      </Dialog>
      {/* <FloatingBall></FloatingBall> */}
    </div>
  );
}
