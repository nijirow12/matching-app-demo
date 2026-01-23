"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { SwipeCard } from "@/components/SwipeCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { MOCK_PROFILES, Profile } from "@/lib/mockData";
import { RefreshCw, X, Heart, Star, Zap, RotateCw } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const [checkingProfile, setCheckingProfile] = useState(true);

  // プロフィール存在確認と他ユーザーの取得
  useEffect(() => {
    const init = async () => {
      if (!isLoaded || !user) return;

      try {
        const token = await getToken({ template: "supabase" });
        const supabase = createSupabaseClient(token);

        // 1. 自分のプロフィールチェック
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!myProfile) {
          router.push("/profile");
          return;
        }

        setCheckingProfile(false);

        // 2. 自分のプロフィールから興味対象を取得
        const { data: currentUserProfile } = await supabase
          .from("profiles")
          .select("interested_in")
          .eq("id", user.id)
          .single();

        const targetGenders = currentUserProfile?.interested_in || ['female'];

        // 3. RPCを使ってランダムかつ未スワイプのユーザーを取得
        const { data: users, error } = await supabase.rpc('get_random_profiles', {
          current_user_id: user.id,
          target_genders: targetGenders,
          limit_count: 10
        });

        if (error) {
          console.error("RPC Error:", error);
          // RPC失敗時のフォールバック
          const { data: fallbackUsers } = await supabase
            .from("profiles")
            .select("*")
            .neq("id", user.id)
            .in("gender", targetGenders) // 最低限性別フィルタだけは機能させる
            .limit(20);

          if (fallbackUsers) {
            const formattedFallback = fallbackUsers.map((u: any) => ({
              id: u.id,
              name: u.name,
              age: u.age,
              bio: u.bio,
              images: u.images || ["https://placehold.co/600x800?text=No+Image"],
              distanceKm: 0,
            }));
            setProfiles(formattedFallback);
          }
        } else if (users) {
          const formattedUsers = users.map((u: any) => ({
            id: u.id,
            name: u.name,
            age: u.age,
            bio: u.bio,
            images: u.images || ["https://placehold.co/600x800?text=No+Image"],
            distanceKm: 0,
          }));
          setProfiles(formattedUsers);
        }

      } catch (error) {
        console.error("Init failed:", error);
      } finally {
        setLoading(false);
        setCheckingProfile(false);
      }
    };

    if (isLoaded && user) {
      init();
    } else if (isLoaded && !user) {
      setLoading(false);
      setCheckingProfile(false);
    }
  }, [isLoaded, user, getToken, router]);

  const handleSwipe = async (direction: "left" | "right", targetId: string) => {
    console.log(`Swiped ${direction} on ${targetId}`);

    // UI反映（カードを消す）
    setTimeout(() => {
      setProfiles((prev) => prev.filter((p) => p.id !== targetId));
    }, 200);

    // DB保存
    if (user) {
      const token = await getToken({ template: "supabase" });
      const supabase = createSupabaseClient(token);

      if (direction === "right") {
        // RPCを使ってLike & マッチ判定
        const { data: result, error } = await supabase.rpc("like_user", {
          current_user_id: user.id,
          target_user_id: targetId
        });
        if (error) {
          console.error("Like error:", error);
        } else if (result?.is_match) {
          // マッチした場合の演出（簡易アラート）
          alert("It's a Match! 🎉");
        }
      } else {
        // Nopeの場合は通常のInsert (制約がないので単純Insert)
        await supabase.from("swipes").insert({
          swiper_id: user.id,
          target_id: targetId,
          direction: direction,
        });
      }
    }
  };

  const handleReset = () => {
    window.location.reload();
  };

  if (loading || checkingProfile) {
    return (
      <div className="flex flex-col items-center w-full h-[calc(100dvh-64px)] bg-slate-50 relative overflow-hidden">
        <div className="flex-1 w-full max-w-md relative p-2 pb-0 flex flex-col justify-end">
          <div className="relative w-full h-full">
            <SkeletonCard />
          </div>
        </div>
        {/* Placeholder for action buttons to prevent layout shift */}
        <div className="flex-none h-24 w-full flex items-center justify-center gap-8 pb-[env(safe-area-inset-bottom)] bg-slate-50 z-20 opacity-50 pointer-events-none">
          <div className="w-14 h-14 bg-gray-200 rounded-full" />
          <div className="w-14 h-14 bg-gray-200 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full h-[calc(100dvh-64px)] bg-slate-50 relative overflow-hidden">
      {/* Card Stack Container - Fills available vertical space */}
      <div className="flex-1 w-full max-w-md relative p-2 pb-0 flex flex-col justify-end">
        <div className="relative w-full h-full">
          {profiles.length > 0 ? (
            profiles.map((profile, index) => {
              return (
                <SwipeCard
                  key={profile.id}
                  profile={profile}
                  onSwipe={(dir) => handleSwipe(dir, profile.id)}
                  style={{
                    zIndex: profiles.length - index,
                  }}
                  isActive={index < 3} // 上位3枚のみ画像を読み込む
                />
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
              <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse" />
              <p className="text-lg font-medium">No more profiles around you.</p>
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                Search Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Compact footer area */}
      <div className="flex-none h-24 w-full flex items-center justify-center gap-8 pb-[env(safe-area-inset-bottom)] bg-slate-50 z-20">
        {/* Nope */}
        <button
          onClick={() => profiles.length > 0 && handleSwipe("left", profiles[0].id)}
          className="w-14 h-14 bg-white rounded-full text-rose-500 shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border border-gray-100"
        >
          <X size={30} strokeWidth={3} />
        </button>

        {/* Like */}
        <button
          onClick={() => profiles.length > 0 && handleSwipe("right", profiles[0].id)}
          className="w-14 h-14 bg-white rounded-full text-green-400 shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border border-gray-100"
        >
          <Heart size={30} strokeWidth={0} fill="currentColor" />
        </button>
      </div>


    </div>
  );
}
