'use client';
import { useUserStore } from '@/hooks/use-user';
import { fetchRequest } from '@/utils/request';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ProgressBar } from './_components/ProgressBar';
import {
  type FormData,
  StepContext,
  Step1,
  Step2,
  Step3,
  StylesData,
  Step4,
  StepGender,
  STEP,
} from './_components/Step';
import { debounce } from '@/utils/debounce-throttle';
import { AppConfigEnv } from '@/lib/utils';

export default function CreateOptionPage() {
  const { userState } = useUserStore();
  const { t } = useTranslation();
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    nickName: '',
    name: '',
    interests: [],
    styleId: '',
    isExperiencePlot: false,
    faceId: '1',
    sex: '',
  });
  const [step, setStep] = useState(STEP.NAME);
  const [progressBarVisible, setProgressBarVisible] = useState(true);
  const [focus, setFocus] = useState(false);
  const searchParams = useSearchParams();
  const [styleByName, setStyleByName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fromExplore, setFromExplore] = useState(false);
  const [interests, setInterests] = useState([]);
  const [styles, setStyles] = useState<StylesData[]>([]);
  const { current: stepTitleMap } = useRef({
    [STEP.NAME]: t('createOptions.enterYourName'),
    [STEP.INTERESTS]: t('createOptions.yourInterests'),
    [STEP.GIRL_STYLE]: t('createOptions.chooseGirlfriendStyle'),
    [STEP.GIRL_NAME]: t('createOptions.herName'),
    [STEP.GENDER]: t('play.yourGender'),
  });

  const btnDisabled = useMemo(() => {
    let bool = true;
    switch (step) {
      case STEP.NAME:
        bool = false;
        break;
      case STEP.INTERESTS:
        bool = !form.interests.length;
        break;
      case STEP.GIRL_STYLE:
        bool = !form.styleId;
        break;
      case STEP.GIRL_NAME:
        bool = false;
        break;
      case STEP.GENDER:
        bool = form.sex === '';
        break;
      default:
        break;
    }
    return bool;
  }, [form.interests.length, form.sex, form.styleId, step]);

  useEffect(() => {
    if (userState.id) {
      setForm((state) => ({
        ...state,
        interests: userState.interests || [],
        sex: userState.sex,
      }));
    }
  }, [userState.id, userState.interests, userState.sex]);

  const setSex = (num: number | string) => {
    setForm((state) => ({
      ...state,
      sex: num,
    }));
  };

  const setInterestIds = (id: never) => {
    const index = form.interests.findIndex((i: never) => i === id);
    if (index === -1) {
      if (form.interests.length >= 5) {
        debounce(() => {
          toast.warning(t('createOptions.youCanChoose'));
        });
        return;
      }

      setForm((state) => ({
        ...state,
        interests: state.interests.concat([id]),
      }));
    } else {
      form.interests.splice(index, 1);

      setForm((state) => ({
        ...state,
        interests: form.interests,
      }));
    }
  };

  const setStyleId = (id: string, name: string) => {
    if (id === 'none') return;
    form.styleId = id;
    setStyleByName(name);
  };

  const onCreate = () => {
    setLoading(true);
    if (!form.nickName) form.nickName = userState.nickName || 'Jack';
    if (!form.name) form.name = styleByName;
    form.isExperiencePlot = true;

    fetchRequest('/restApi/friend/generate', form).then(({ result, code }) => {
      if (code === 1001) {
        router.replace('/create-result?source=unlock_girl');
        return;
      }
      const { name, friendStyleName, head, id, animationCover } = result;
      if (userState.premiumStatus === 'NONE') {
        const friendForm: any = {
          id,
          head,
          animationCover,
        };
        if (name !== friendStyleName) friendForm.name = name;
        router.replace(
          `/create-result?creating=1&friendForm=${encodeURIComponent(
            JSON.stringify(friendForm)
          )}`
        );
      } else {
        router.replace(`/chat?friendId=${id}`);
      }
    });
  };

  const getList = () => {
    if (!progressBarVisible) return;
    fetchRequest(
      '/restApi/interest/interestTags',
      {},
      {
        method: 'GET',
      }
    ).then(({ result: Interests }) => {
      setInterests(Interests || []);
    });
    if (progressBarVisible) {
      fetchRequest(
        `/restApi/friendStyle/girlfriendStyle?reviewVersion=${AppConfigEnv.APPVERSIONCODE}&type=${AppConfigEnv.APPTYPE}`,
        {},
        {
          method: 'GET',
        }
      ).then(({ result: styles }: { result: never[] }) => {
        setStyles([
          ...(styles || []),
          {
            id: 'none',
            name: '',
            cover: '',
            label: 'COMING SOON',
          },
        ]);
      });
    }
  };

  const onTabBtn = (val: STEP) => {
    if (!progressBarVisible) {
      fetchRequest('/restApi/member/update', {
        interests: form.interests,
        sex: form.sex,
      })
        .then(() => {
          toast(t('indexMine.successfullySet'));
          router.back();
        })
        .finally(() => {});
      return;
    } else {
      setStep(val);
    }
  };

  useEffect(() => {
    const styleId = searchParams.get('styleId');
    const styleByName = searchParams.get('styleByName');
    const setting = searchParams.get('setting') as STEP;
    const interests = searchParams.get('interests');
    const sex = searchParams.get('sex');

    if (setting) {
      setProgressBarVisible(false);
      setStep(setting);

      if (sex) setForm((state) => ({ ...state, sex: sex }));

      if (Array.isArray(interests)) {
        interests.forEach((interestId) => {
          setInterestIds(interestId as never);
        });
      }
    }
    if (styleId) {
      setStep(STEP.GIRL_STYLE);
      setStyleByName(styleByName!);
      setFromExplore(true);
      setForm((state) => ({ ...state, styleId: styleId }));
    }

    getList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getComponent() {
    switch (step) {
      case STEP.NAME:
        return <Step1 setFocus={setFocus}></Step1>;
      case STEP.INTERESTS:
        return <Step2 setInterestIds={setInterestIds}></Step2>;
      case STEP.GIRL_STYLE:
        return <Step3 setStyleId={setStyleId}></Step3>;
      case STEP.GIRL_NAME:
        return <Step4 setFocus={setFocus} onCreate={onCreate}></Step4>;
      case STEP.GENDER:
        return <StepGender setSex={setSex} onCreate={onCreate}></StepGender>;
    }
  }

  return (
    <div className="full-page flex flex-col !min-h-[unset] h-full">
      <ProgressBar visible={progressBarVisible} step={step}></ProgressBar>

      <StepContext.Provider
        value={{
          setting: !progressBarVisible,
          focus,
          loading,
          form,
          fromExplore,
          interests,
          styles,
          styleByName,
          stepTitleMap,
          btnDisabled,
          userState,
          setForm,
          onTabBtn,
        }}
      >
        {getComponent()}
      </StepContext.Provider>
    </div>
  );
}
