"use client";

import { FC, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { fetchRequest } from "@/utils/request";
import { useTranslation } from "@/locales/client";
import { useParams } from "next/navigation";
import "yet-another-react-lightbox/styles.css";
import Lightbox from "yet-another-react-lightbox";
import Cookies from "js-cookie";
import emitter from "@/utils/bus";
import { filterImage } from "@/utils/business";
import Image from "next/image";

interface Post {
  id: string;
  content: string;
  imageUrls: string[];
  customProfileUrl: string;
  customProfileName: string;
  isPremium: boolean;
  createTime: string;
  friendStyle: {
    id: string;
    name: string;
    head: string;
    cover: string;
    description: string;
    character: string;
    greeting: string;
    hide: number;
    label: string;
    sn: string;
    type: string;
    validated: number;
    version: number;
    visibility: string;
  };
}

interface ApiResponse {
  code: number;
  message: string;
  result: {
    userInfo: {
      premium: {
        hasPremium: boolean;
        startTime: string;
        endTime: string;
        status: string;
      };
      profilePic: string;
      name: string;
      id: string;
    };
    current: string;
    total: string;
    pages: string;
    records: Post[];
  };
}

const Page: FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageNo, setPageNo] = useState(1);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [userInfo, setUserInfo] = useState<
    ApiResponse["result"]["userInfo"] | null
  >(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [currentImageUrls, setCurrentImageUrls] = useState<string[]>([]);
  const [authError, setAuthError] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

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

  const getPosts = useCallback(
    (reset = false) => {
      if (loading || loaded) return;

      setLoading(true);
      const currentPage = reset ? 1 : pageNo + 1;

      fetchRequest(`/restApi/posts/list/${currentPage}/50`, undefined, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response: ApiResponse) => {
          // Handle authentication errors
          if (response.code === 401) {
            setAuthError(true);
            setPosts([]);
            return;
          }

          // Handle other error codes
          if (response.code !== 200) {
            console.error("Error fetching posts:", response.message);
            // Clear posts if it's a fresh load
            if (reset) setPosts([]);
            return;
          }

          // Ensure result exists before processing
          if (!response.result) {
            console.error("Invalid response structure");
            if (reset) setPosts([]);
            return;
          }

          const { records, total, userInfo } = response.result;

          setUserInfo(userInfo);

          // Only update posts if we have valid records
          if (reset) {
            setPosts(records);
          } else {
            setPosts((prev) => [...prev, ...records]);
          }

          setTotal(parseInt(total));
          setLoaded(currentPage * 50 >= parseInt(total));
          if (currentPage * 50 >= parseInt(total)) {
            setLoading(false);
          }
          setPageNo(currentPage);
          setHasFetched(true);
        })
        .catch((error) => {
          if (error.response?.status === 401) {
            setAuthError(true);
            setPosts([]);
          } else if (currentPage === 1) {
            setPosts([]);
            setLoaded(true);
          }
        })
        .finally(() => {
          setTimeout(() => setLoading(false), 100);
          setHasFetched(true);
        });
    },
    [loading, pageNo, loaded]
  );

  useEffect(() => {
    getPosts(true);
  }, [getPosts]);

  useEffect(() => {
    const handleScroll = () => {
      const isBottom =
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.scrollHeight - 100;

      if (isBottom && !loaded && !loading && posts.length > 0) {
        getPosts();
      }
    };

    if (!loaded) {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [posts, loaded, loading, getPosts]);

  const handleUnlock = (post: Post) => {
    if (userInfo?.premium?.hasPremium) {
      alert("You already have access to this premium content!");
    } else {
      router.push(`/${params.lng}/create-result?source=unlock_post`);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleImageClick = (post: Post, index: number) => {
    if (post.isPremium && !userInfo?.premium?.hasPremium) {
      handleUnlock(post);
      return;
    }
    const validImageUrls = post.imageUrls
      .filter((url) => url.trim() !== "")
      .map((url) => filterImage(url));
    setCurrentImageUrls(validImageUrls);
    setCurrentPost(post);
    setCurrentImageIndex(index);
    setIsOpen(true);
  };

  const handleProfileClick = (post: Post) => {
    if (
      Cookies.get("token") ||
      (typeof window != "undefined" &&
        origin !== "https://www.telegramloveai.com")
    ) {
      emitter.emit("setGlobalLoading", true);
      createFriend(post.friendStyle.id, post.friendStyle.name);
    } else {
      router.push(`/chat?styleId=${post.friendStyle.id}`);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20 mt-0">
      {authError && (
        <div className="text-center py-12">
          <div className="bg-white/5 rounded-xl p-8">
            <h2 className="text-xl text-white mb-4">
              {t("Login to View Posts")}
            </h2>
            <button
              onClick={() => router.push(`/${params.lng}/login`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-colors"
            >
              {t("Login / Sign Up")}
            </button>
          </div>
        </div>
      )}

      {!authError && posts.length === 0 && hasFetched && (
        <div className="text-center text-white/60 py-12">
          {t("No posts available")}
        </div>
      )}

      {posts.map((post) => (
        <article
          key={post.id}
          className="bg-white/5 rounded-xl overflow-hidden"
        >
          <div
            className="p-4 flex items-center space-x-3 cursor-pointer"
            onClick={() =>
              router.push(`/${params.lng}/profile/${post.friendStyle.sn}`)
            }
          >
            <Image
              src={filterImage(post.customProfileUrl)}
              alt={post.customProfileName}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="text-white font-medium">
                {post.customProfileName}
              </h3>
              <p className="text-white/60 text-sm">
                {formatTimestamp(post.createTime)}
              </p>
            </div>
            {post.isPremium && (
              <button
                onClick={() => handleUnlock(post)}
                className={cn(
                  "px-4 py-1.5 text-white text-sm rounded-full flex items-center gap-2 transition-colors",
                  userInfo?.premium?.hasPremium
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    : "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      userInfo?.premium?.hasPremium
                        ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        : "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    }
                  />
                </svg>
                {userInfo?.premium?.hasPremium ? "Premium" : "Unlock"}
              </button>
            )}
          </div>

          <p className="px-4 text-white/90 mb-8 text-lg">{post.content}</p>

          {(() => {
            const validImageUrls = post.imageUrls.filter(
              (url) => url.trim() !== ""
            );
            if (validImageUrls.length === 0) return null;
            return (
              <div className="relative mt-4 px-4 pb-4">
                <div
                  className={cn("grid gap-3", {
                    "grid-cols-1": validImageUrls.length === 1,
                    "grid-cols-2": validImageUrls.length === 2,
                    "grid-cols-3": validImageUrls.length >= 3,
                  })}
                >
                  {validImageUrls.map((image, idx) => (
                    <div
                      key={idx}
                      className={cn("relative group cursor-pointer", {
                        "aspect-video": validImageUrls.length === 1,
                        "aspect-square": validImageUrls.length > 1,
                        "col-span-3": validImageUrls.length === 1,
                        "col-span-1": validImageUrls.length > 1,
                      })}
                      onClick={() => handleImageClick(post, idx)}
                    >
                      <Image
                        src={filterImage(image)}
                        alt=""
                        width={300}
                        height={300}
                        className={cn(
                          "w-full h-full object-cover",
                          validImageUrls.length === 1
                            ? "rounded-lg"
                            : "rounded-md",
                          post.isPremium &&
                            !userInfo?.premium?.hasPremium &&
                            "blur-[5px] brightness-75"
                        )}
                      />
                      {post.isPremium && !userInfo?.premium?.hasPremium && (
                        <div
                          className="absolute inset-0 flex items-center justify-center cursor-pointer"
                          onClick={() => handleUnlock(post)}
                        >
                          <div className="bg-black/30 p-3 rounded-xl flex items-center justify-center group-hover:bg-black/50 transition-colors">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={cn(
                                "text-white",
                                validImageUrls.length === 1
                                  ? "h-12 w-12"
                                  : "h-8 w-8"
                              )}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </article>
      ))}

      {loading && (
        <div className="text-center text-white/60 py-4">Loading...</div>
      )}

      {currentPost && (
        <Lightbox
          open={isOpen}
          close={() => setIsOpen(false)}
          index={currentImageIndex}
          slides={currentImageUrls.map((url) => ({ src: url }))}
          carousel={{
            finite: true,
            preload: 1,
          }}
          animation={{ fade: 300 }}
          controller={{ closeOnBackdropClick: true }}
        />
      )}
    </div>
  );
};

export default Page;
