"use client";

import { useEffect, useState, useRef, use } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { createSupabaseClient } from "@/lib/supabase";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Message {
    id: number;
    sender_id: string;
    content: string;
    created_at: string;
}

interface PartnerProfile {
    id: string;
    name: string;
    image: string;
}

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: partnerId } = use(params);

    const { getToken } = useAuth();
    const { user } = useUser();
    const router = useRouter();

    const [messages, setMessages] = useState<Message[]>([]);
    const [partner, setPartner] = useState<PartnerProfile | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // パートナー情報とメッセージ履歴の取得
    useEffect(() => {
        const init = async () => {
            if (!user) return;

            const token = await getToken({ template: "supabase" });
            const supabase = createSupabaseClient(token);

            // 1. パートナー情報
            const { data: partnerData } = await supabase
                .from("profiles")
                .select("name, images")
                .eq("id", partnerId)
                .single();

            if (partnerData) {
                setPartner({
                    id: partnerId,
                    name: partnerData.name,
                    image: partnerData.images?.[0] || ""
                });
            }

            // 2. メッセージ履歴
            const { data: msgData, error } = await supabase
                .from("messages")
                .select("*")
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
                .order("created_at", { ascending: true });

            if (msgData) {
                setMessages(msgData);
            }

            // 3. リアルタイム購読 (Supabase Realtime)
            const channel = supabase
                .channel('chat_room')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `receiver_id=eq.${user.id}`, // 自分宛のメッセージ
                    },
                    (payload) => {
                        if (payload.new.sender_id === partnerId) {
                            setMessages((prev) => [...prev, payload.new as Message]);
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        init();
    }, [user, partnerId, getToken]);

    // 自動スクロール
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || sending) return;

        const content = newMessage.trim();
        setNewMessage("");
        setSending(true);

        try {
            // 楽観的UI更新
            const optimisitcMsg: Message = {
                id: Date.now(),
                sender_id: user.id,
                content: content,
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, optimisitcMsg]);

            const token = await getToken({ template: "supabase" });
            const supabase = createSupabaseClient(token);

            const { error } = await supabase.from("messages").insert({
                sender_id: user.id,
                receiver_id: partnerId,
                content: content
            });

            if (error) throw error;
        } catch (error) {
            console.error("Failed to send:", error);
            alert("送信に失敗しました");
        } finally {
            setSending(false);
        }
    };

    if (!partner) return <div className="p-4 text-center">Loading chat...</div>;

    return (
        <div className="flex flex-col h-[100dvh] bg-white">
            {/* Header */}
            <header className="flex-none h-16 border-b border-gray-100 flex items-center px-4 bg-white sticky top-0 z-10">
                <Link href="/chat" className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
                    <ArrowLeft size={24} />
                </Link>
                <div className="ml-2 flex items-center gap-3">
                    <img src={partner.image} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                    <span className="font-bold text-gray-800">{partner.name}</span>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        First conversation with {partner.name}. Say Hi! 👋
                    </div>
                )}
                {messages.map((msg) => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${isMine
                                    ? "bg-rose-500 text-white rounded-br-none"
                                    : "bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-sm"
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-none p-4 bg-white border-t border-gray-100 pb-8 safe-area-bottom">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-100 border-none rounded-full px-5 py-3 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="bg-rose-500 text-white p-3 rounded-full hover:bg-rose-600 disabled:opacity-50 disabled:scale-95 transition-all shadow-md flex items-center justify-center aspect-square"
                    >
                        <Send size={20} className="ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
