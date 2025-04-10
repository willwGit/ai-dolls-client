import { useUserStore } from '@/hooks/use-user';
import { fetchRequest } from './request';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import emitter from './bus';
import { AppConfigEnv } from '@/lib/utils';
import Cookies from 'js-cookie';

/**
 * 转换接口返回图片地址路径
 */
export function filterImage(url: string, side?: string) {
  if (!url) return '';

  if (url.startsWith('file:')) return url;

  const isHttpUrl = url && url.indexOf('http') === -1 && url.indexOf('/') !== 0;

  if (!isHttpUrl) return url;

  if (side) url += `?x-oss-process=image/resize,m_lfit,w_${side}`;
  return AppConfigEnv.OSS + url;
}

/**
 * @desc 简写时间
 * @param date 字符串时间
 */
export function filterAbbrTime(date: string | Date) {
  if (!date) return '';
  const fmt = 'yyyy-MM-dd hh:mm';
  const newTime = filterFormatDate(date, fmt);
  const today = filterFormatDate(new Date(), fmt);
  return newTime.slice(0, 10) === today.slice(0, 10)
    ? filterFormatDate(date, 'hh:mm')
    : filterFormatDate(date, 'yyyy-MM-dd');
}

/**
 * TODO 跳转路径更改
 * @desc 生成朋友
 * @param styleId
 * @param name
 * @param closed 是否关闭当前页
 */
export function createFriend(
  styleId: number,
  name: string,
  closed: boolean = false
) {
  return new Promise((resolve, reject) => {
    fetchRequest('/restApi/friend/generate', {
      name,
      isExperiencePlot: true,
      styleId,
      faceId: '1',
    })
      .then((res) => {
        resolve('');
        if (res.code === 1001) {
          window.location.href = '/create-result?source=unlock_girl';
          return;
        }

        const { name: girlName, head, id } = res.result;
        const { userState } = useUserStore.getState();
        if (userState.premiumStatus === 'NONE') {
          const friendForm = {
            head,
            id,
            name: girlName,
          };

          window.location.href = `/create-result?creating=1&type=USER&friendForm${encodeURIComponent(
            JSON.stringify(friendForm)
          )}`;
        } else if (closed) {
          window.location.replace(`/chat-result?friendId=${id}`);
        } else {
          window.location.href = `/chat-result?friendId=${id}`;
        }
      })
      .catch(() => {
        reject();
      });
  });
}

/**
 * @desc 根据创建聊天
 * @param styleId
 */
export function createChatById(styleId: number) {
  return new Promise((resolve, reject) => {
    fetchRequest(
      `/restApi/friendStyle/random?reviewVersion=${AppConfigEnv.APPVERSIONCODE}&type=${AppConfigEnv.APPTYPE}`,
      { styleId }
    )
      .then((res) => {
        resolve('');
        if (res.code === 1001) {
          window.location.href = '/create-result?source=unlock_girl';
          return;
        }
        const { id } = res.result;
        window.location.href = `/chat?friendId=${id}`;
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * @desc 上传文件
 * @param file 文件
 * @param fileName
 */
export function uploadFile(file: File | Blob, fileName: string = '') {
  return new Promise<any>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('folder', 'user_upload');
    fetchRequest(`/util/file/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
      .then((res) => {
        resolve(res.result);
      })
      .catch(() => {
        reject();
      });
  });
}

/**
 * @desc 返回cache页
 * @param interest 用户所选兴趣
 */
export function goBackCache(
  interest: string,
  lng: string,
  replace: AppRouterInstance['replace']
) {
  let { pathname, search = '' } = JSON.parse(
    localStorage.getItem('auth-cache-url') || '{}'
  );
  console.log(pathname, search);

  localStorage.removeItem('auth-cache-url');
  if (!interest && pathname !== `/${lng}/chat`) {
    replace('/');
  } else if (localStorage.getItem('deleteAccount')) {
    localStorage.removeItem('deleteAccount');
    replace('/');
  } else if (pathname && pathname !== `/${lng}`) {
    replace(pathname + search);
  } else {
    replace('/');
  }
}

/**
 * @returns 保留两位小数的数字, val 为 0 则返回 0， val 为 '' 返回 ''
 */
export function filterPrice(val: number) {
  if (!val) return val === 0 ? 0 : '';
  if (!(val % 100)) return parseInt(String(val / 100));

  return (val / 100).toFixed(val % 10 ? 2 : 1);
}

/**
 * @desc 计算热度
 * @param popularity 发起会话用户数
 */
export function filterPopularity(popularity: number) {
  const num = popularity * 99 || 0;
  if (num < 100) return 0;

  let divisor: number;
  let unit = '';

  if (num >= 1e9) {
    divisor = 1e9;
    unit = 'b';
  } else if (num >= 1e6) {
    divisor = 1e6;
    unit = 'm';
  } else {
    divisor = 1e3;
    unit = 'k';
  }

  let result = num / divisor;
  if (result % 1 !== 0) {
    result = Math.ceil(result * 10) / 10;
  }
  return result + unit;
}

export function logout(noBack?: string) {
  emitter.emit('logout');
  const clearUser = useUserStore.getState().clearUser;
  Cookies.remove('token');

  clearUser();
  const { pathname, search } = window.location;
  if (pathname === '/login') return;
  let loginParams = '';
  if (pathname === '/chat') {
    loginParams = search || '';
  }
  if (!noBack) {
    const form: {
      pathname: string;
      search?: string;
    } = { pathname };
    if (search) form.search = search;
    localStorage.setItem('auth-cache-url', JSON.stringify(form));
  }
}

/**
 * @desc 计算时间差
 * @param date 字符串时间
 */
export function filterCountTime(date: string, t: (s: string) => string) {
  if (!date) return '-';
  const nowTime = new Date().getTime();
  const difference = nowTime - Number(date);

  if (difference < 60 * 1000) {
    return t('component.justNow');
  }
  if (difference < 60 * 60 * 1000) {
    return `${parseInt(String(difference / (60 * 1000)), 10)}m`;
  }
  if (difference < 24 * 60 * 60 * 1000) {
    return `${parseInt(String(difference / (60 * 60 * 1000)), 10)}h`;
  }
  if (difference < 2 * 24 * 60 * 60 * 1000) {
    return '1d';
  }
  if (difference < 3 * 24 * 60 * 60 * 1000) {
    return '2d';
  }
  return filterFormatDate(date, 'yyyy.MM.dd');
}

/**
 * @desc 格式化时间
 * @param date date对象/时间戳/字符串时间
 * @param fmt 格式
 * @return 格式化时间字符串
 */
export const filterFormatDate = (
  date: string | Date,
  fmt = 'yyyy-MM-dd hh:mm:ss'
) => {
  if (!date) return '-';
  // 时间戳
  if (!Number.isNaN(+date)) date = new Date(+date);
  // 字符串
  else if (!(date instanceof Date))
    date = new Date(`${date}`.replace(/-/g, '/'));
  if (Number.isNaN(date.getTime())) return '-';
  const opt = {
    'y+': `${date.getFullYear()}`, // 年
    'M+': `${date.getMonth() + 1}`, // 月
    'd+': `${date.getDate()}`, // 日
    'h+': `${date.getHours()}`, // 时
    'm+': `${date.getMinutes()}`, // 分
    's+': `${date.getSeconds()}`, // 秒
    'q+': `${Math.floor((date.getMonth() + 3) / 3)}`, // 季度
  };
  Object.keys(opt).forEach((k) => {
    const ret = new RegExp(`${k}`).exec(fmt);
    if (ret)
      fmt = fmt.replace(
        ret[0],
        opt[k as keyof typeof opt].padStart(ret[0].length, '0')
      );
  });
  return fmt;
};

/**
 * @desc 字节长度
 * @param str 字符串
 */
export function calculateByteLength(str: string) {
  let byteLength = 0;

  for (let i = 0; i < str.length; i += 1) {
    const charCode = str.charCodeAt(i);

    // 根据字符的 Unicode 编码范围判断字节长度
    if (
      (charCode >= 0x0001 && charCode <= 0x007f) || // ASCII 字符和大多数日语/阿拉伯语字符
      (charCode >= 0xff61 && charCode <= 0xff9f) || // 日语字符范围
      (charCode >= 0x0600 && charCode <= 0x06ff)
    ) {
      // 阿拉伯语字符范围
      byteLength += 1;
    } else {
      byteLength += 2; // 其他字符（例如中文）
    }
  }

  return byteLength;
}
