"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { SwipeCard } from "@/components/SwipeCard";
import { MOCK_PROFILES, Profile } from "@/lib/mockData";
import { RefreshCw, X, Heart, Star, Zap, RotateCw } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";

export default function Home() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDirection, setLastDirection] = useState<string | null>(null);
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
    setLastDirection(direction);

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
    return <div className="flex h-full items-center justify-center text-rose-500 font-bold animate-pulse">Loading profiles...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-between h-full bg-slate-100 relative pb-[env(safe-area-inset-bottom)]">

      {/* Card Stack Container - Adjust height dynamically */}
      <div className="w-full max-w-md h-full max-h-[72dvh] mt-2 relative px-2 flex-shrink-0">
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

      {/* Action Buttons - Fixed at bottom with safe area */}
      <div className="flex items-center justify-center gap-10 w-full pb-6 pt-2">
        {/* Nope */}
        <button
          onClick={() => profiles.length > 0 && handleSwipe("left", profiles[0].id)}
          className="w-16 h-16 bg-white rounded-full text-rose-500 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border border-gray-100"
        >
          <X size={32} strokeWidth={3} />
        </button>

        {/* Like */}
        <button
          onClick={() => profiles.length > 0 && handleSwipe("right", profiles[0].id)}
          className="w-16 h-16 bg-white rounded-full text-green-400 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border border-gray-100"
        >
          <Heart size={32} strokeWidth={0} fill="currentColor" />
        </button>
      </div>

      {lastDirection && (
        <div className={`absolute top-20 font-bold px-6 py-2 rounded border-4 transform -rotate-6 z-50 animate-fade-out pointer-events-none ${lastDirection === 'right' ? 'border-green-400 text-green-400' : 'border-rose-500 text-rose-500'
          }`}>
          {lastDirection === 'right' ? 'LIKE' : 'NOPE'}
        </div>
      )}
    </div>
  );
}
