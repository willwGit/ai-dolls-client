/*
 * @Author: peng-xiao-shuai
 * @Date: 2024-04-01 10:41:43
 * @LastEditors: peng-xiao-shuai
 * @LastEditTime: 2024-04-01 11:07:39
 * @Description:
 */
import { toast } from "sonner";
import { objectToQueryString } from "./string-transform";
import { AppConfigEnv } from "@/lib/utils";
import { logout } from "./business";
import Cookie from "js-cookie";
import { createDebounce } from "./debounce-throttle";
const [debounce] = createDebounce();

export const fetchRequest = async <T = any>(
  url: string,
  body?: Indexes | FormData,
  options: RequestInit = {}
) => {
  try {
    // Check if token exists, if not, set it
    const defaultToken =
      "eyJhbGciOiJIUzUxMiJ9.eyJyYW5kb21LZXkiOiJqbnU3OTEiLCJzdWIiOiIxNjQwNTQzOTY0Njc3MzIwNzA2IiwiZXhwIjoxNjgyMzkwMzM1LCJpYXQiOjE2Nzk5NzExMzV9.C58hQ903EPbRN8Xo_Vdrml9lQiiahdR_YVYbWL9osoxRfr9QlZq89mpuy-GnoVkiEEntgLt7XC5-yxHUXlbzVQ";

    if (!Cookie.get("token")) {
      Cookie.set("token", defaultToken, { expires: 365 });
    }

    const token = Cookie.get("token") || defaultToken;

    const headers: any = {
      "Content-Type": "application/json", // 指定发送的数据类型为 JSON
      ...(options.headers || {}),
    };

    // 注意：当使用 FormData 时，不要设置 `Content-Type`。浏览器会自动设置正确的 `Content-Type: multipart/form-data` 和正确的 boundary。
    // 如果手动设置了，可能会导致服务器无法正确解析数据。
    if (body?.append) {
      delete headers["Content-Type"];
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const URL = AppConfigEnv.HOST + url;

    /**
     * get 请求拼接参数
     */
    if (options.method === "GET") {
      url += objectToQueryString(body || {});
    }

    const res = await fetch(URL, {
      method: "POST",
      ...(options || {}),
      [options.method === "GET" ? "params" : "body"]: body?.append
        ? body
        : JSON.stringify(body || {}),
      headers,
    });

    const data: {
      code: number;
      message: string;
      result: T;
    } = await res.json();

    if (data.code === 401 && location.pathname.indexOf("/login") == -1) {
      logout();
    }

    if (data.code === 500) {
      throw new Error(data.message);
    }

    return {
      ...data,
      result: (data.result || {}) as T,
    };
  } catch (err: any) {
    console.log(url, "报错：", err);
    debounce(() => {
      toast(err.message);
    });
    throw new Error(err.message);
  }
};
