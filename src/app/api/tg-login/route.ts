import { NextRequest } from "next/server";
import { validate } from "./check";
import axios from "axios";
import { getAppConfigEnv } from "@/lib/utils";

const handle = async (req: NextRequest) => {
  const body = await req.json();

  const AppConfigEnv = getAppConfigEnv(process.env.NEXT_ORIGIN);

  try {
    // validate(body.initData, process.env.NEXT_PUBLIC_TOKEN!);

    const searchParams = new URLSearchParams(body.initData);
    const user = JSON.parse(searchParams.get("user")!);

    const { data: ApiData } = await axios(
      AppConfigEnv.HOST + "/restApi/platform/google/auth/authLogin",
      {
        method: "POST",
        data: {
          loginType: "telegram-mini-apps",
          email: "",
          nickname:
            user.first_name + (user.last_name ? " " + user.last_name : ""),
          openId: user.id,
          avatarUrl: user.photo_url,
          loginName: user.username,
          userPlatform: body.source,
        },
      }
    );

    return Response.json(ApiData, {
      status: 200,
    });
  } catch (error: any) {
    return Response.json(
      {
        code: "500",
        message: error.message || "",
      },
      { status: 500 }
    );
  }
};
export { handle as POST };
