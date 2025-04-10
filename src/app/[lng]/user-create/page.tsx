"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useTranslation } from "@/locales/client";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchRequest } from "@/utils/request";
import {
  type StepContextType,
  StepContext,
  BaseStep,
  PersonalityStep,
  GreetingStep,
} from "./_components/Client";
import { Button } from "@/components/Button";
import { toast } from "sonner";
import { CenterPopup } from "@/components/CenterPopup";
import { ClientProgress } from "./_components/ClientProgress";
import { debounce } from "@/utils/debounce-throttle";
import { SOURCE } from "../(chat)/chat/enum";

// 每次都是最新的
let _form: StepContextType["form"] = {
  cover: "",
  name: "",
  visibility: "PUBLIC",
  description: "",
  extDescription: "",
  greeting: "",
  characterRaw: "[]",
};

function UserCreatePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(0);
  const [tipVisible, setTipVisible] = useState(false);
  const [backVisible, setBackVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState(
    `${t("userCreate.name")} ${t("userCreate.NeedFill")}`
  );

  const [form, setFormData] = useState<StepContextType["form"]>({ ..._form });
  const [hasDoNext, setHasDoNext] = useState(false);
  const [hasDoCreate, setHasDoCreate] = useState(false);
  const [headerItems] = useState([
    t("userCreate.basics"),
    t("userCreate.personality"),
    t("userCreate.greeting"),
  ]);
  const [personalityGroup, setPersonalityGroup] = useState<any[]>([]);
  const [occupationExtItems, setOccupationExtItems] = useState<any[]>([]);
  const [occupationExtIdx, setOccupationExtIdx] = useState<"" | number>("");

  const setForm = (val: StepContextType["form"]) => {
    _form = val;
    setFormData(val);
  };

  const onTabBack = () => {
    if (activeTab === 0) {
      setBackVisible(true);
      return;
    }
    setActiveTab((state) => (state -= 1));
  };

  const onTapNext = async () => {
    if (activeTab === 1) {
      if (form.extDescription.length > 500) return;
      if (occupationExtIdx === "") {
        const occupationData = personalityGroup.find(
          (item) => item.label === "Occupation"
        );
        if (occupationData && occupationData.selected === "") {
          toast(t("userCreate.NeedOccupation"));
          return;
        }
      }
      formatCharacterRaw();
    }

    if (activeTab === 2) {
      if (form.greeting.length > 120) return;
      setHasDoCreate(true);

      if (!form.greeting) {
        setTip(`${t("userCreate.greeting")} ${t("userCreate.NeedFill")}`);
        setTipVisible(true);
        return;
      }

      setLoading(true);
      try {
        if (form.id) {
          await fetchRequest("/restApi/friendStyle/update", form);
          setLoading(false);
          router.back();
        } else {
          const { result = {} } = await fetchRequest(
            "/restApi/friendStyle/addUGC",
            form
          );
          const { id, name } = result;
          const res = await fetchRequest("/restApi/friend/generate", {
            name,
            faceId: "1",
            styleId: id,
          });
          setLoading(false);

          if (res.code === 1001) {
            router.push("create-result?source=unlock_girl");
            return;
          }
          const { id: girlId } = res.result;
          router.replace(
            `chat?friendId=${girlId}&source=${SOURCE.USER_CREATE}`
          );
        }
      } catch (err) {
        setLoading(false);
      }

      return;
    }

    setHasDoNext(true);

    if (activeTab === 0) {
      if (form.name.length > 15) return;
      if (form.description.length > 60) return;
      if (checkBasicsEmpty()) return;
    }

    if (activeTab < 2) {
      setActiveTab((state) => (state += 1));
    }
  };

  const formatCharacterRaw = () => {
    const characters: any[] = [];
    personalityGroup.forEach((item) => {
      if (item.type === "SINGLE" && item.selected) {
        characters.push(
          item.values.find((option: any) => item.selected === option.id)
        );
      } else if (item.type === "MULTIPLE" && item.selected.length) {
        characters.push(
          ...item.values.filter((option: any) =>
            item.selected.includes(option.id)
          )
        );
      }
    });

    if (occupationExtIdx !== "") {
      const occupationExtItem = occupationExtItems[occupationExtIdx];
      if (occupationExtItem) {
        characters.push(occupationExtItem);
      }
    }
    setForm({
      ..._form,
      characterRaw: JSON.stringify(characters),
    });
  };

  const checkBasicsEmpty = () => {
    if (!form.name || (!form.description && form.visibility === "PUBLIC")) {
      console.log(
        form.name
          ? `${t("userCreate.subtitle")} ${t("userCreate.NeedFill")}`
          : `${t("userCreate.name")} ${t("userCreate.NeedFill")}`
      );

      setTip(
        form.name
          ? `${t("userCreate.subtitle")} ${t("userCreate.NeedFill")}`
          : `${t("userCreate.name")} ${t("userCreate.NeedFill")}`
      );
      setTipVisible(true);
      return true;
    }
    return false;
  };

  const getDetail = (id: string) => {
    fetchRequest(`/restApi/friendStyle/detail/${id}`).then((res) => {
      const detail = res.result;
      Object.keys(_form).forEach((k) => {
        _form[k] = detail[k] as any;
      });
      setForm(_form);
      getPersonalityGroup();
    });
  };

  const getPersonalityGroup = () => {
    fetchRequest("/restApi/friendStylePersonality/personalityGroup").then(
      (res) => {
        const CopyState = Object.keys(res.result).map((label, index) => {
          const values = res.result[label] as any[];
          const type =
            values[0] && values[0].selection === "MULTIPLE"
              ? "MULTIPLE"
              : "SINGLE";
          const row: any = {
            label,
            values,
            type,
            selected: type === "MULTIPLE" ? [] : "",
            folding: index !== 0,
          };

          const characters = JSON.parse(_form.characterRaw || "[]") as any[];
          const characterIds = characters.map((option) => option.id);

          if (type === "SINGLE") {
            const singleItem = values.find((option) =>
              characterIds.includes(option.id)
            );
            if (singleItem) {
              row.selected = singleItem.id;
            } else if (label === "Occupation") {
              getOccupationExtItems<any[]>().then((data) => {
                const idx = data.findIndex((extOption) =>
                  characterIds.includes(extOption.id)
                );
                if (idx !== -1) {
                  setOccupationExtIdx(idx);
                }
              });
            }
          } else {
            row.selected = values
              .filter((option) => characterIds.includes(option.id))
              .map((item) => item.id);
          }

          return row;
        });

        setPersonalityGroup(CopyState);
      }
    );
  };

  const getOccupationExtItems = <T,>(): Promise<T> => {
    return new Promise((resolve, reject) => {
      fetchRequest("/restApi/friendStylePersonality/occupationMore")
        .then((res) => {
          res.result = [
            {
              createTime: "2023-12-29 07:19:18",
              extension: "",
              id: "53",
              more: 1,
              option: "▶️Role Play",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 1,
              type: "Occupation",
              updateTime: "2023-12-29 07:19:18",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2023-12-29 07:13:12",
              extension: "",
              id: "52",
              more: 1,
              option: "👸🏻Role Play",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 40,
              type: "Occupation",
              updateTime: "2023-12-29 07:13:12",
              validated: 1,
              version: 2,
            },
            {
              createTime: "2023-12-27 03:47:28",
              extension: "",
              id: "51",
              more: 1,
              option: "Detective",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 49,
              type: "Occupation",
              updateTime: "2023-12-27 03:47:28",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2023-12-18 07:20:54",
              extension: "",
              id: "33",
              more: 1,
              option: "teacher",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2023-12-18 07:20:58",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2023-12-18 07:24:19",
              extension: "",
              id: "34",
              more: 1,
              option: "gamer",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2023-12-18 07:24:19",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2023-12-18 07:24:19",
              extension: "",
              id: "35",
              more: 1,
              option: "porn actress",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2023-12-18 07:24:19",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2023-12-18 07:24:19",
              extension: "",
              id: "36",
              more: 1,
              option: "asian girl",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2023-12-18 07:24:19",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2023-12-18 07:24:19",
              extension: "",
              id: "37",
              more: 1,
              option: "african girl",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2023-12-18 07:24:19",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2023-12-18 07:24:19",
              extension: "",
              id: "38",
              more: 1,
              option: "Masochism",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2023-12-18 07:24:19",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2023-12-18 07:24:19",
              extension: "",
              id: "39",
              more: 1,
              option: "doctor",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2023-12-18 07:24:19",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2023-12-18 07:24:19",
              extension: "",
              id: "40",
              more: 1,
              option: "mother",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2023-12-18 07:24:19",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2023-12-18 07:24:19",
              extension: "",
              id: "41",
              more: 1,
              option: "singer",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2023-12-18 07:24:19",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2023-12-18 07:24:19",
              extension: "",
              id: "42",
              more: 1,
              option: "artist",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2023-12-18 07:24:19",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2023-12-18 07:24:19",
              extension: "",
              id: "43",
              more: 1,
              option: "musician",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2023-12-18 07:24:19",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2023-12-18 07:24:19",
              extension: "",
              id: "44",
              more: 1,
              option: "Hooker",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2023-12-18 07:24:19",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2023-12-18 07:24:19",
              extension: "",
              id: "45",
              more: 1,
              option: "Professor",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2023-12-18 07:24:19",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2023-12-18 07:24:19",
              extension: "",
              id: "46",
              more: 1,
              option: "Queen",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2023-12-18 07:24:19",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2023-12-18 07:24:19",
              extension: "",
              id: "47",
              more: 1,
              option: "Girlfriend",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2023-12-18 07:24:19",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2023-12-18 07:24:19",
              extension: "",
              id: "48",
              more: 1,
              option: "actor",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2023-12-18 07:24:19",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2024-03-26 08:30:06",
              extension: "",
              id: "55",
              more: 1,
              option: "Model",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2024-03-26 08:30:06",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2024-03-26 08:30:18",
              extension: "",
              id: "56",
              more: 1,
              option: "Airline stewardess",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2024-03-26 08:30:18",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2024-03-26 08:30:27",
              extension: "",
              id: "57",
              more: 1,
              option: "Beauty expert",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2024-03-26 08:30:27",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2024-03-26 09:26:02",
              extension: "",
              id: "58",
              more: 1,
              option: "Socialite",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 100,
              type: "Occupation",
              updateTime: "2024-03-26 09:26:02",
              validated: 1,
              version: 1,
            },
            {
              createTime: "2024-01-27 04:02:43",
              extension: "",
              id: "54",
              more: 1,
              option: "killers of the flower moon",
              putaway: 1,
              remark: "",
              selection: "SINGLE",
              sort: 101,
              type: "Occupation",
              updateTime: "2024-01-27 04:02:43",
              validated: 1,
              version: 2,
            },
          ];
          const data = res.result.map((item: any) => ({
            ...item,
            text: item.option,
            value: item.id,
          }));
          setOccupationExtItems(data);
          resolve(data);
        })
        .catch(() => {
          reject();
        });
    });
  };

  useEffect(() => {
    const id = searchParams.get("id");
    debounce(() => {
      if (id) {
        setForm({
          ..._form,
          id,
        });
        getDetail(id);
      } else {
        getPersonalityGroup();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`full-page bible-quote flex flex-col`}>
      <Navbar back={onTabBack}>
        <div
          className="cancle-btn text-lg font-bold"
          onClick={() => {
            setBackVisible(true);
          }}
        >
          {t("component.cancel")}
        </div>
      </Navbar>

      <div className="flex-1 mt-16">
        <ClientProgress
          headerItems={headerItems}
          activeTab={activeTab}
        ></ClientProgress>

        <div className="container__tab px-5">
          <StepContext.Provider
            value={{
              form,
              _form,
              setForm,
              hasDoNext,
              personalityGroup,
              setPersonalityGroup,
              occupationExtIdx,
              setOccupationExtIdx,
              occupationExtItems,
              t,
            }}
          >
            {activeTab === 0 && <BaseStep></BaseStep>}
            {activeTab === 1 && <PersonalityStep></PersonalityStep>}
            {activeTab === 2 && <GreetingStep></GreetingStep>}
          </StepContext.Provider>
        </div>

        <div className="my-8 mx-4">
          <Button
            disabled={loading}
            title={
              activeTab === 2 ? t("userCreate.create") : t("createOptions.next")
            }
            className="cus-btn bold !rounded-2xl !mb-0"
            click={onTapNext}
          ></Button>
        </div>
      </div>

      <CenterPopup
        open={tipVisible}
        title=" "
        subtitle={t("userCreate.nearlyThere") + "..." + "\n" + tip}
        confirmText={t("component.cancel")}
        isBlack
        plain
        plainBtn
        onConfirm={() => {
          setTipVisible(false);
        }}
      />
      <CenterPopup
        open={backVisible}
        title={t("userCreate.areYouSure") + "?"}
        subtitle={t("userCreate.exitingTip")}
        confirmText={t("component.cancel")}
        cancleText={t("userCreate.YesExit")}
        isBlack
        plain
        plainBtn
        onClose={() => {
          router.replace("/");
        }}
        onConfirm={() => {
          setBackVisible(false);
        }}
      />
    </div>
  );
}

export default UserCreatePage;
