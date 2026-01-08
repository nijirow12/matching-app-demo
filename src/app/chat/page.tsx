"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { createSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Heart } from "lucide-react";

interface ChatUser {
    id: string;
    name: string;
    image: string;
    lastMessage?: string;
}

interface LikedUser {
    id: string;
    name: string;
    image: string;
    timestamp: string;
}

export default function ChatListPage() {
    const { getToken } = useAuth();
    const { user, isLoaded } = useUser();
    const [activeTab, setActiveTab] = useState<"matches" | "likes">("matches");

    const [matches, setMatches] = useState<ChatUser[]>([]);
    const [likedConfig, setLikedConfig] = useState<LikedUser[]>([]);
    const [loading, setLoading] = useState(true);

    // マッチとLikeされたリストを取得
    useEffect(() => {
        const fetchData = async () => {
            if (!isLoaded || !user) return;

            try {
                const token = await getToken({ template: "supabase" });
                const supabase = createSupabaseClient(token);

                // 1. マッチ済みのユーザー取得 (RPC使用)
                const { data: matchedIdsData, error: matchError } = await supabase
                    .rpc('get_matched_user_ids', { current_user_id: user.id });

                if (matchError) console.error("Match fetch error:", matchError);

                const matchedIds = new Set<string>();
                if (matchedIdsData) {
                    matchedIdsData.forEach((item: any) => {
                        const id = typeof item === 'string' ? item : item.get_matched_user_ids || Object.values(item)[0];
                        matchedIds.add(String(id));
                    });
                }

                // マッチ相手のプロフィール情報を取得
                if (matchedIds.size > 0) {
                    const { data: profiles } = await supabase
                        .from("profiles")
                        .select("id, name, images")
                        .in("id", Array.from(matchedIds));

                    if (profiles) {
                        // 本来は最後のメッセージも取得すべきだが今回は省略
                        setMatches(profiles.map((p: any) => ({
                            id: p.id,
                            name: p.name,
                            image: p.images?.[0] || "",
                            lastMessage: "New match! Say hello 👋"
                        })));
                    }
                } else {
                    setMatches([]);
                }

                // 2. 自分をLikeしてくれているユーザー取得 (Likes You)
                // target_id = 自分, direction = right
                const { data: likesData } = await supabase
                    .from("swipes")
                    .select("swiper_id, created_at")
                    .eq("target_id", user.id)
                    .eq("direction", "right");

                const likerIds = new Set<string>();
                const likeMap = new Map<string, string>(); // id -> created_at

                if (likesData) {
                    likesData.forEach((l: any) => {
                        // すでにマッチしている人は除外
                        if (!matchedIds.has(l.swiper_id)) {
                            likerIds.add(l.swiper_id);
                            likeMap.set(l.swiper_id, l.created_at);
                        }
                    });
                }

                if (likerIds.size > 0) {
                    const { data: profiles } = await supabase
                        .from("profiles")
                        .select("id, name, images")
                        .in("id", Array.from(likerIds));

                    if (profiles) {
                        setLikedConfig(profiles.map((p: any) => ({
                            id: p.id,
                            name: p.name,
                            image: p.images?.[0] || "",
                            timestamp: likeMap.get(p.id) || ""
                        })));
                    }
                } else {
                    setLikedConfig([]);
                }

            } catch (error) {
                console.error("Error fetching chats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isLoaded, user, getToken]);

    // Likeバックする処理 (Likes Youタブから)
    const handleLikeBack = async (targetId: string) => {
        if (!user) return;
        const token = await getToken({ template: "supabase" });
        const supabase = createSupabaseClient(token);

        const { error } = await supabase.rpc("like_user", {
            current_user_id: user.id,
            target_user_id: targetId
        });

        if (error) {
            console.error(error);
            alert(`Failed to match: ${error.message}`); // 詳細を表示
            return;
        }

        alert("It's a Match! 🎉");
        window.location.reload(); // リロードしてChatsタブに移動させる
    };

    if (loading) return <div className="p-8 text-center text-rose-500">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-white sticky top-16 z-10">
                <button
                    onClick={() => setActiveTab("matches")}
                    className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider ${activeTab === "matches" ? "text-rose-500 border-b-2 border-rose-500" : "text-gray-400"}`}
                >
                    Matches <span className="ml-1 px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full text-xs">{matches.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab("likes")}
                    className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider ${activeTab === "likes" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-gray-400"}`}
                >
                    Likes You <span className="ml-1 px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded-full text-xs">{likedConfig.length}</span>
                </button>
            </div>

            <div className="p-4">
                {activeTab === "matches" && (
                    <div className="space-y-4">
                        {matches.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No matches yet. Keep swiping!</p>
                            </div>
                        ) : (
                            matches.map(match => (
                                <Link href={`/chat/${match.id}`} key={match.id} className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                    <img src={match.image} alt={match.name} className="w-16 h-16 rounded-full object-cover border-2 border-rose-100" />
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800">{match.name}</h3>
                                        <p className="text-sm text-gray-500 truncate">{match.lastMessage}</p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "likes" && (
                    <div className="grid grid-cols-2 gap-4">
                        {likedConfig.length === 0 ? (
                            <div className="col-span-2 text-center py-20 text-gray-400">
                                <Heart size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No likes yet.</p>
                            </div>
                        ) : (
                            likedConfig.map(user => (
                                <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group">
                                    <div className="aspect-[3/4] relative">
                                        <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleLikeBack(user.id)}
                                                className="bg-rose-500 text-white px-4 py-2 rounded-full font-bold shadow-lg transform scale-90 group-hover:scale-100 transition-all"
                                            >
                                                Like back
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-bold text-gray-800 text-sm">{user.name}</h3>
                                        <p className="text-xs text-rose-500 font-medium mt-1">Likes you</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
