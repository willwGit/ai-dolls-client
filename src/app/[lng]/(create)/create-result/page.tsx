/* eslint-disable @next/next/no-img-element */
"use client";
import { useUserStore } from "@/hooks/use-user";
import { filterPrice } from "@/utils/business";
import { fetchRequest } from "@/utils/request";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/locales/client";
import { toast } from "sonner";
import { Mask } from "./_components/Mask";
import { CreateLoading } from "./_components/CreateLoading";
import { ClientDesc, ClientHead, ClientPay } from "./_components/Client";
import {
  TonConnectUI,
  useTonAddress,
  useTonConnectUI,
} from "@tonconnect/ui-react";
import { beginCell, toNano } from "ton";
import { useConnectWallet } from "@/hooks/use-connect-wallet";
import AppConfigEnv from "@/lib/utils";

export default function CreateResultPage({
  params: { lng },
}: CustomReactParams) {
  const { userState, setData } = useUserStore();
  const { t } = useTranslation();
  const address = useTonAddress(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const isPremium = useMemo(() => {
    if (userState.id) {
      return !["NONE", "ACTIVITY_EXPERIENCE"].includes(userState.premiumStatus);
    }
    return false;
  }, [userState.id, userState.premiumStatus]);

  const [creating, setCreating] = useState(false);
  const [progressNum, setProgressNum] = useState(0);
  const [beCloseText, setBeCloseText] = useState(t("chat.beCloser"));
  const [source, setSource] = useState("");
  const [payType, setPayType] = useState(
    AppConfigEnv.isTG && Boolean(window.Telegram.WebApp.initData) ? "3" : "1"
  );
  const [loading, setLoading] = useState(false);
  const cacheMeal = useRef<Indexes>({});
  const [detail, setDetail] = useState<Indexes>({});
  const backUrl = useMemo(() => {
    const backRoute = detail.id ? `chat?friendId=${detail.id}&` : "";
    const backUrl =
      typeof window === "undefined"
        ? ""
        : `${window.location.origin}/${lng}${
            backRoute ? "/" + backRoute : "?"
          }t=${Date.now()}&m=${filterPrice(
            Number(cacheMeal.current.price)
          )}&payType=${payType}`;
    return backUrl;
  }, [detail.id, lng, payType]);

  const { handleOpen, isCheck } = useConnectWallet({
    bindSuccessCB: () => {
      tonSendTransaction();
    },
  });

  /**
   * 实际发起支付
   */
  const tonSendTransaction = async () => {
    try {
      const { result } = await fetchRequest(
        "/telegram/prePay/" + cacheMeal.current.id
      );
      const { boc } = await tonConnectUi.sendTransaction({
        // The transaction is valid for 10 minutes from now, in unix epoch seconds.
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: "UQBKzPZIgD6Y5iFMvI4dM4McnwD0w1ED1l7JwxKbOYj9gByH",
            amount: toNano(result.setMealPrice / 100).toString(),
            payload: beginCell()
              .storeUint(0, 32)
              .storeStringTail(result.id)
              .endCell()
              .toBoc()
              .toString("base64"),
          },
        ],
      });
      toast(
        "We are comfiring the payment, please wait and VIP is on the road!"
      );

      setLoading(false);
      router.replace(backUrl);
      // const { code } = await fetchRequest('/telegram/payConfirm');
      // const time = setInterval(async () => {
      //   const result = await setData();
      //   if (result.premiumStatus !== 'NONE') {
      //     clearInterval(time);
      //     // router.replace('/');
      //   }
      // }, 5000);
    } catch (error: any) {
      toast(error.message);
      setLoading(false);
    }
  };

  const paysType = [
    {
      label: "Ton Wallet",
      payValue: "3",
      isTG: true,
    },
    {
      label: "Stripe",
      payValue: "1",
    },
    // {
    //   label: 'Payer Max',
    //   payValue: '2',
    // },
  ];

  let tonConnectUi: TonConnectUI;
  try {
    const [tonUi] = useTonConnectUI();
    tonConnectUi = tonUi;
  } catch (err) {}

  const preDownloadImg = () => {
    setDetail((state) => ({ ...state, head: state.animationCover }));
  };

  const onSubscribe = async (item: any = {}) => {
    if (isPremium) {
      toast(t("createResult.subscribedTip"));
      return;
    }
    console.log(item, "item");

    if (item.id) {
      cacheMeal.current = item;
    }
    const { id } = item.id ? item : cacheMeal.current;

    setLoading(true);
    fbq("track", "InitiateCheckout", {
      payType: paysType.find((item) => item.payValue == payType)?.label,
    });

    if (payType === "3") {
      if (!address && !isCheck) {
        setLoading(false);
        handleOpen();
        return;
      }

      tonSendTransaction();
      return;
    }

    const { result } = await fetchRequest(
      payType === "1"
        ? `/stripe/createSession/${id}`
        : `/payermax/createOrder/${id}`,
      {
        chance: source,
        backUrl: backUrl,
      }
    );

    if (result) {
      setTimeout(() => {
        setLoading(false);
        window.location.replace(result);
      }, 500);
    } else {
      toast(t("createResult.checkFailure"));
    }
  };

  // const testPay = (osName, id) => {
  //   this.$loading()
  //   this.$post('/restApi/setMealOrder/add', {
  //     setMealProductId: id
  //   }).then((res) => {
  //     const payNo = res.result
  //     // 测试支付
  //     const date = new Date().getTime()
  //     this.$post('/restApi/setMealOrder/payOrder?identify=D7F619012407E4791E90FDB2C7FD55D1', {
  //       payNo,
  //       paymentState: 1,
  //       expiryTimeMillis: date + 1000 * 60 * 60 * 24,
  //       startTimeMillis: date,
  //       payType: osName === 'ios' ? 'APPLE' : 'GOOGLE',
  //       orderId: payNo
  //     }).then(() => {
  //       this.paySucc()
  //     })
  //   })
  // }

  const payError = (msg: string, reason = null) => {
    if (msg) toast(msg);
    console.log(reason);
  };

  const goToChat = () => {
    const { id } = detail;
    if (id) {
      router.replace(`/chat?friendId=${id}`);
    } else {
      router.back();
    }
  };

  useEffect(() => {
    const source = searchParams.get("source");
    const creating = searchParams.get("creating") === "1";
    const friendForm = searchParams.get("friendForm");
    const noLoad = searchParams.get("noLoad");
    setCreating(creating);
    setDetail(JSON.parse(decodeURIComponent(friendForm || "") || "{}"));

    let timer: NodeJS.Timeout;
    if (creating) {
      setSource("creat_girl");
      if (noLoad === "1") {
        setProgressNum(100);
      } else {
        let progressNum = 0;
        timer = setInterval(() => {
          const num = parseInt(String(Math.random() + 4), 10);
          const res = num + progressNum;

          if (res >= 100) {
            setProgressNum(100);
            clearInterval(timer);
          } else {
            progressNum += num;
            setProgressNum(progressNum);
          }
        }, 80);
      }
    } else {
      setSource(source!);
      setProgressNum(100);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="full-page transition-all duration-300 !min-h-[100vh] pt-24 !overflow-auto">
      <Mask detail={detail}></Mask>

      {progressNum !== 100 && creating ? (
        <CreateLoading progressNum={progressNum} />
      ) : (
        <></>
      )}

      {progressNum === 100 && (
        <div className="absolute left-0 top-0 w-full h-full">
          <div className="flex flex-col justify-between absolute top-0 left-0 w-full h-full">
            <ClientHead
              goToChat={goToChat}
              isPremium={isPremium}
              creating={creating}
            ></ClientHead>

            <div className="text-center">
              {!detail.head && (
                <img
                  className="mx-auto mb-12 w-20 h-20 rounded-2xl"
                  src="/gifs/logo.gif"
                  alt=""
                />
              )}
              <ClientDesc
                isPremium={isPremium}
                creating={creating}
                beCloseText={beCloseText}
              ></ClientDesc>

              {creating && isPremium ? (
                <button
                  className="cus-btn mx-9"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, #665ef2 0%, #8f54ee 100%)",
                  }}
                  onClick={goToChat}
                >
                  {t("createResult.startChat")}
                </button>
              ) : (
                <>
                  <ClientPay
                    payType={payType}
                    paysType={paysType}
                    setPayType={setPayType}
                    onSubscribe={onSubscribe}
                  ></ClientPay>

                  <div className="w-full h-14"></div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
