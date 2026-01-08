"use client";

import Link from "next/link";
import { User, Flame, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { createSupabaseClient } from "@/lib/supabase";

export function Header() {
    const pathname = usePathname();
    const { getToken, userId } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    // パスが変わるたび、または定期的に未読チェック
    useEffect(() => {
        const checkUnread = async () => {
            if (!userId) return;
            try {
                const token = await getToken({ template: "supabase" });
                const supabase = createSupabaseClient(token);

                // 今回は簡易的に「Likes」の数 + 「Messages」の未読（本来は既読管理が必要だが省略）を表示
                // 'swipes' where target_id = me AND direction = right
                // ※ 本当は 'last_seen' とかがないと未読管理できないので、
                //    ここでは「自分へのLike数」をバッジとして出すことにします（モチベUP用）

                const { count } = await supabase
                    .from("swipes")
                    .select("*", { count: 'exact', head: true })
                    .eq("target_id", userId)
                    .eq("direction", "right");

                setUnreadCount(count || 0);
            } catch (e) {
                console.error(e);
            }
        };

        checkUnread();

        // 60秒ごとに更新
        const interval = setInterval(checkUnread, 60000);
        return () => clearInterval(interval);
    }, [userId, getToken, pathname]);

    const isActive = (path: string) => pathname === path ? "text-rose-500" : "text-gray-300 hover:text-rose-500";

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100 h-16">
            <div className="max-w-xl mx-auto h-full px-6 flex items-center justify-between">

                {/* Profile Link */}
                <Link href="/profile" className={`p-2 transition-colors ${isActive('/profile')}`}>
                    <User size={28} strokeWidth={2.5} />
                </Link>

                {/* Main Logo (Home) */}
                <Link href="/" className="p-2">
                    <div className={`rounded-full p-1.5 shadow-lg hover:scale-105 transition-transform ${pathname === '/' ? 'bg-gradient-to-tr from-rose-600 to-orange-600' : 'bg-gradient-to-tr from-rose-500 to-orange-500'}`}>
                        <Flame size={28} fill="white" color="white" strokeWidth={0} />
                    </div>
                </Link>

                {/* Chat Link */}
                <Link href="/chat" className={`p-2 transition-colors relative ${isActive('/chat')}`}>
                    <MessageCircle size={28} strokeWidth={2.5} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    );
}
