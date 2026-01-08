"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { SwipeCard } from "@/components/SwipeCard";
import { MOCK_PROFILES, Profile } from "@/lib/mockData";
import { RefreshCw } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";

export default function Home() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // 配列の先頭が一番手前のカードになるように今回はそのまま使用するか、
  // あるいはpopしていく形式にするか。
  // 通常、スタックUIではindexが大きい方が手前、または0が手前で重なり順(zIndex)を制御する。
  // ここでは profiles[0] を一番手前として扱うシンプルな実装にします。

  // MOCK_PROFILESは初期値から削除、最初は空配列
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
            // 重複スワイプのフィルタリングは省略（本来やるべき）
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
    // リセット機能はデバッグ用に残すが、本来は「もうユーザーがいません」となるべき
    // ここではページリロードするだけにする
    window.location.reload();
  };

  if (loading || checkingProfile) {
    return <div className="flex h-screen items-center justify-center text-rose-500 font-bold">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-gray-100 overflow-hidden relative">
      <div className="w-full max-w-sm h-[600px] relative">
        {profiles.length > 0 ? (
          profiles.map((profile, index) => {
            // 一番手前だけ操作可能にする
            const isFront = index === 0;
            return (
              <SwipeCard
                key={profile.id}
                profile={profile}
                onSwipe={(dir) => handleSwipe(dir, profile.id)}
                style={{
                  zIndex: profiles.length - index, // 手前ほどzIndex高く
                  // 後ろのカードは少し小さく見せるなどの演出も本来はここに
                }}
              />
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-xl mb-4">No more profiles!</p>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-full font-bold shadow-lg hover:bg-rose-600 transition-colors"
            >
              <RefreshCw size={20} />
              Reset
            </button>
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div className="mt-8 flex gap-6 z-10">
        <button
          onClick={() => profiles.length > 0 && handleSwipe("left", profiles[0].id)}
          className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-red-500 text-2xl hover:scale-110 active:scale-95 transition-transform"
        >
          ✕
        </button>
        <button
          onClick={() => alert("Super Like functionality coming soon!")}
          className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-400 text-2xl hover:scale-110 active:scale-95 transition-transform"
        >
          ★
        </button>
        <button
          onClick={() => profiles.length > 0 && handleSwipe("right", profiles[0].id)}
          className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-green-400 text-2xl hover:scale-110 active:scale-95 transition-transform"
        >
          ♥
        </button>
      </div>

      {lastDirection && (
        <div className="absolute top-10 text-gray-400 text-sm">
          Last swipe: {lastDirection.toUpperCase()}
        </div>
      )}
    </div>
  );
}
