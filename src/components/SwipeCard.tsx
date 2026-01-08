"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useState } from "react";
import { Profile } from "@/lib/mockData";
import { X, Heart } from "lucide-react";

interface SwipeCardProps {
    profile: Profile;
    onSwipe: (direction: "left" | "right") => void;
    style?: React.CSSProperties; // zIndex等の制御用
}

export function SwipeCard({ profile, onSwipe, style }: SwipeCardProps) {
    const [exitX, setExitX] = useState<number | null>(null);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

    // 重なりによるLike/Nopeインジケーターの不透明度
    const likeOpacity = useTransform(x, [10, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-10, -100], [0, 1]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            setExitX(200);
            onSwipe("right");
        } else if (info.offset.x < -threshold) {
            setExitX(-200);
            onSwipe("left");
        } else {
            // 元に戻る
        }
    };

    return (
        <motion.div
            style={{
                x,
                rotate,
                opacity: exitX ? 0 : 1, // スワイプ確定後は消える
                ...style,
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            animate={exitX ? { x: exitX, opacity: 0 } : { x: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 w-full max-w-sm h-[600px] cursor-grab active:cursor-grabbing bg-white rounded-3xl shadow-xl overflow-hidden select-none"
        >
            {/* 画像 */}
            <div className="relative h-full w-full">
                <img
                    src={profile.images[0]}
                    alt={profile.name}
                    className="h-full w-full object-cover pointer-events-none"
                    draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />

                {/* Like印 */}
                <motion.div
                    style={{ opacity: likeOpacity }}
                    className="absolute top-10 left-6 border-[6px] border-green-400 rounded-lg px-4 py-1 rotate-[-15deg] z-10"
                >
                    <span className="text-4xl font-extrabold text-green-400 uppercase tracking-widest">LIKE</span>
                </motion.div>

                {/* Nope印 */}
                <motion.div
                    style={{ opacity: nopeOpacity }}
                    className="absolute top-10 right-6 border-[6px] border-rose-500 rounded-lg px-4 py-1 rotate-[15deg] z-10"
                >
                    <span className="text-4xl font-extrabold text-rose-500 uppercase tracking-widest">NOPE</span>
                </motion.div>

                {/* テキスト情報 (オーバーレイ) */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white pb-8">
                    <div className="flex items-baseline gap-3 mb-1">
                        <h2 className="text-4xl font-bold drop-shadow-md">{profile.name}</h2>
                        <span className="text-2xl font-medium opacity-90">{profile.age}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-3 text-sm font-medium opacity-80">
                        <span>📍 {profile.distanceKm || 1} km away</span>
                    </div>
                    <p className="text-base leading-relaxed opacity-90 line-clamp-3 shadow-sm">{profile.bio}</p>
                </div>
            </div>
        </motion.div>
    );
}
