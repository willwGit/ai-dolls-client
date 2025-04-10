import { toast } from 'sonner';

/**
 * 字符串 token 转对象
 */
export function parseCookies(cookieString: string) {
  const list: { [key: string]: string } = {};
  cookieString &&
    cookieString.split(';').forEach((cookie) => {
      const parts: string[] = cookie.split('=');
      if (parts.length) {
        list[parts.shift()!.trim()] = decodeURI(parts.join('='));
      }
    });
  return list;
}

/**
 * 对象转url查询参数
 * @returns '&a=1&b=2'
 */
export function objectToQueryString(params: Indexes) {
  return Object.keys(params)
    .map(
      (key) => encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
    )
    .join('&');
}

/**
 * 复制内容
 */
export function copyText(value: string, cb?: Function, isShowTip?: false) {
  // 兼容低版本不存在 navigator.clipboard 情况
  if (navigator.clipboard && navigator.permissions) {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        if (isShowTip !== false) {
          toast.success('Copy Successfully');
        }
        cb?.();
      })
      .catch((err) => {
        console.error('Unable to copy text to clipboard', err);
      });
  } else {
    // 创建dom
    const input = document.createElement('input');
    input.setAttribute('value', value);
    input.style.position = 'fixed';
    input.style.left = '999px';
    input.style.top = '10px';
    // 选中文本
    document.body.appendChild(input);
    input.select();

    document.execCommand('copy');

    if (isShowTip !== false) {
      toast.success('Copy Successfully');
    }
    //  删除dom
    document.body.removeChild(input);

    cb?.();
  }
}
