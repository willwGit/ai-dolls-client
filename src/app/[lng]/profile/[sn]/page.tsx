/* eslint-disable @next/next/no-img-element */
"use client";
import { fetchRequest } from "@/utils/request";
import { filterImage } from "@/utils/business";
import { useTranslation } from "@/locales/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Cookies from "js-cookie";
import emitter from "@/utils/bus";
import { AppConfigEnv } from "@/lib/utils";

export default function ProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const sn = params.sn as string;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImageUrls, setCurrentImageUrls] = useState<string[]>([]);
  const [existingChat, setExistingChat] = useState<any>(null);
  const [buttonLoading, setButtonLoading] = useState(true);
  const [isProfileImageOpen, setIsProfileImageOpen] = useState(false);

  const handleProfileImageClick = () => {
    setCurrentImageUrls([filterImage(profile.customProfileUrl)]);
    setCurrentImageIndex(0);
    setIsProfileImageOpen(true);
  };

  const handleImageClick = (imageUrls: string[], index: number) => {
    const filteredImageUrls = imageUrls
      .filter((url) => url.trim() !== "")
      .map((url) => filterImage(url));
    setCurrentImageUrls(filteredImageUrls);
    setCurrentImageIndex(index);
    setIsOpen(true);
  };

  const fetchProfileAndPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchRequest(
        `/restApi/posts/byFriendStyle/${sn}/1/10`
      );

      if (response.code === 200) {
        setProfile({
          ...response.result.friendStyle,
          customProfileUrl: response.result.friendStyle.head,
          customProfileName: response.result.friendStyle.name,
          isPremium: response.result.records.some(
            (post: { isPremium: any }) => post.isPremium
          ),
        });
        setPosts(
          response.result.records.map((post: { imageUrls: any[] }) => ({
            ...post,
            imageUrls: post.imageUrls.filter(
              (url: string) => url.trim() !== ""
            ),
          }))
        );
      } else {
        setError(true);
        toast(t("common.errorFetching"));
      }
    } catch (err) {
      setError(true);
      toast(t("common.errorFetching"));
    } finally {
      setLoading(false);
    }
  }, [sn, t]);

  useEffect(() => {
    if (sn) {
      fetchProfileAndPosts();
    }
  }, [sn, fetchProfileAndPosts]);

  useEffect(() => {
    if (profile) {
      const fetchConversations = async () => {
        try {
          setButtonLoading(true);
          const response = await fetchRequest(
            `/restApi/friend/list/v2?reviewVersion=${AppConfigEnv.APPVERSIONCODE}&type=H5`,
            { pageSize: 100 }
          );

          if (response.code === 200) {
            const { conversations } = response.result;

            const matchingChat = conversations.rows.find((item: any) => {
              return item.friendStyleSn === profile?.sn;
            });

            setExistingChat(matchingChat);
          }
        } catch (err) {
        } finally {
          setButtonLoading(false);
        }
      };

      fetchConversations();
    }
  }, [profile]);

  const createChat = () => {
    if (
      Cookies.get("token") ||
      (typeof window !== "undefined" &&
        window.location.origin !== "https://www.telegramloveai.com")
    ) {
      emitter.emit("setGlobalLoading", true);
      fetchRequest("/restApi/friend/generate", {
        name: profile.name,
        faceId: "1",
        styleId: profile.id,
        isExperiencePlot: true,
      })
        .then(({ code, result }) => {
          if (code !== 200) return;
          router.push(`/chat?friendId=${result.id}`);
          emitter.emit("setGlobalLoading", false);
        })
        .catch(() => {
          emitter.emit("setGlobalLoading", false);
        });
    } else {
      router.push(`/chat?styleId=${profile.id}`);
    }
  };

  if (loading) {
    return (
      <div className="full-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="full-page flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{t("common.errorLoadingProfile")}</p>
        <button
          onClick={fetchProfileAndPosts}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="full-page pt-4 bg-[#f5f5fd]">
      <div className="max-w-2xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Image
                width={80}
                height={80}
                className="rounded-full border-2 border-purple-200 cursor-pointer"
                src={filterImage(
                  profile.customProfileUrl || "/images/default-head.png"
                )}
                alt={profile.customProfileName}
                onClick={handleProfileImageClick}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#181425]">
                {profile.name}
              </h1>
              {/* <p className="text-[#625e6f]">@{profile.sn}</p> */}
            </div>
          </div>

          {/* Add character details */}
          {profile.character && (
            <div className="mb-6">
              <h3 className="text-[#181425] font-bold mb-2">
                {t("Description")}
              </h3>
              <div className="text-[#625e6f] text-sm whitespace-pre-line">
                {profile.description && (
                  <p className="text-[#625e6f] text-sm mt-2">
                    {profile.description}
                  </p>
                )}
                {/* {profile.character
                  .split("\n")
                  .map((line: string, index: number) => (
                    <p key={index}>{line}</p>
                  ))} */}
              </div>
            </div>
          )}

          {/* Add greeting section */}
          {profile.greeting && (
            <div className="bg-[#f0f0ff] p-4 rounded-lg mb-6">
              <p className="text-[#625e6f] italic">
                &quot;{profile.greeting}&quot;
              </p>
            </div>
          )}

          <button
            onClick={() => {
              if (existingChat) {
                router.push(`/chat?friendId=${existingChat.id}`);
                emitter.emit("setGlobalLoading", false);
              } else {
                createChat();
              }
            }}
            disabled={buttonLoading}
            className="w-full bg-gradient-to-r from-[#736bff] to-[#e254ee] text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
          >
            {buttonLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t("Loading...")}</span>
              </div>
            ) : existingChat ? (
              t("Open Chat")
            ) : (
              t("Start Chat")
            )}
          </button>
        </div>

        {/* Posts Grid */}
        <h2 className="text-xl font-bold text-[#181425] mb-4">
          {t("profile.posts")}
        </h2>
        <div className="space-y-6 pb-20">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white/5 rounded-xl overflow-hidden"
            >
              <div className="p-4 flex items-center space-x-3">
                <img
                  src={filterImage(post.customProfileUrl)}
                  alt={post.customProfileName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-[#ffffff] font-medium">
                    {post.customProfileName}
                  </h3>
                  <p className="text-[#625e6f] text-sm">
                    {formatTimestamp(post.createTime)}
                  </p>
                </div>
                {post.isPremium && (
                  <button
                    className={cn(
                      "px-4 py-1.5 text-white text-sm rounded-full flex items-center gap-2",
                      profile.isPremium
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : "bg-gradient-to-r from-pink-500 to-purple-500"
                    )}
                  >
                    {profile.isPremium ? t("Premium") : t("Unlock")}
                  </button>
                )}
              </div>

              <p className="px-4 text-[#ffffff] mb-4 text-lg">{post.content}</p>

              {post.imageUrls?.length > 0 && (
                <div className="relative mt-4 px-4 pb-4">
                  <div
                    className={cn("grid gap-3", {
                      "grid-cols-1": post.imageUrls.length === 1,
                      "grid-cols-2": post.imageUrls.length === 2,
                      "grid-cols-3": post.imageUrls.length >= 3,
                    })}
                  >
                    {post.imageUrls
                      .slice(0, 4)
                      .map((img: string, idx: number) => (
                        <div
                          key={idx}
                          className={cn(
                            "relative group cursor-pointer aspect-square",
                            {
                              "col-span-3": post.imageUrls.length === 1,
                            }
                          )}
                          onClick={() => handleImageClick(post.imageUrls, idx)}
                        >
                          <img
                            src={filterImage(img)}
                            alt=""
                            className={cn(
                              "w-full h-full object-cover rounded-lg",
                              post.isPremium &&
                                !profile.isPremium &&
                                "blur-[5px] brightness-75"
                            )}
                          />
                          {post.isPremium && !profile.isPremium && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <div className="bg-black/30 p-2 rounded-lg">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-6 w-6 text-white"
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
              )}
            </article>
          ))}

          <Lightbox
            open={isOpen}
            close={() => setIsOpen(false)}
            index={currentImageIndex}
            slides={currentImageUrls.map((url) => ({ src: url }))}
            carousel={{ finite: true, preload: 1 }}
            animation={{ fade: 300 }}
          />

          <Lightbox
            open={isProfileImageOpen}
            close={() => setIsProfileImageOpen(false)}
            index={currentImageIndex}
            slides={currentImageUrls.map((url) => ({ src: url }))}
            carousel={{ finite: true, preload: 1 }}
            animation={{ fade: 300 }}
          />
        </div>

        {posts.length === 0 && (
          <div className="text-center py-8 text-[#625e6f]">
            {t("profile.noPosts")}
          </div>
        )}
      </div>
    </div>
  );
}
