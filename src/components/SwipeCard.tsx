"use client";

import { motion, useMotionValue, useTransform, PanInfo, useMotionValueEvent } from "framer-motion";
import { useState, useCallback } from "react";
import { Profile } from "@/lib/mockData";
import { X, Heart, RefreshCw } from "lucide-react";

interface SwipeCardProps {
    profile: Profile;
    onSwipe: (direction: "left" | "right") => void;
    style?: React.CSSProperties; // zIndex等の制御用
    isActive?: boolean; // 画像を読み込むかどうか
}

export function SwipeCard({ profile, onSwipe, style, isActive = true }: SwipeCardProps) {
    const [exitX, setExitX] = useState<number | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageError, setImageError] = useState<Record<number, boolean>>({});
    const [retryCount, setRetryCount] = useState<Record<number, number>>({});
    const [cacheBuster, setCacheBuster] = useState<Record<number, string>>({});

    const handleImageError = (index: number) => {
        const currentRetries = retryCount[index] || 0;
        if (currentRetries < 3) {
            // 自動リトライ: キャッシュバスティング用のクエリパラメータを追加
            setRetryCount(prev => ({ ...prev, [index]: currentRetries + 1 }));
            setCacheBuster(prev => ({ ...prev, [index]: Date.now().toString() }));
        } else {
            // リトライ上限に達した場合はエラー表示
            setImageError((prev) => ({ ...prev, [index]: true }));
        }
    };

    const handleManualRetry = (e: React.MouseEvent) => {
        e.stopPropagation();
        const index = currentImageIndex;
        setImageError((prev) => ({ ...prev, [index]: false }));
        setRetryCount((prev) => ({ ...prev, [index]: 0 }));
        setCacheBuster((prev) => ({ ...prev, [index]: Date.now().toString() }));
    };

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

    // 重なりによるLike/Nopeインジケーターの不透明度
    const likeOpacity = useTransform(x, [10, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-10, -100], [0, 1]);

    const [isDragging, setIsDragging] = useState(false);

    // xの値が0に戻ったらドラッグ状態を解除（念のための安全策）
    useMotionValueEvent(x, "change", (latest) => {
        if (latest === 0 && isDragging) {
            setIsDragging(false);
        }
    });

    const handleDragStart = () => {
        setIsDragging(true);
    };

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 100;
        const velocityThreshold = 500; // フリックの速度しきい値

        // ドラッグ距離が十分か、または勢いよくフリックされた場合
        if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
            setExitX(1000); // 画面外へ確実に出す
            onSwipe("right");
        } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
            setExitX(-1000); // 画面外へ確実に出す
            onSwipe("left");
        } else {
            // 元に戻る際は明示的にモーション値をリセット
            x.set(0);
            setIsDragging(false);
        }
    };

    const handleTap = (e: React.MouseEvent | React.TouchEvent, direction: "prev" | "next") => {
        e.stopPropagation();
        if (direction === "next") {
            setCurrentImageIndex((prev) =>
                prev < (profile.images?.length || 1) - 1 ? prev + 1 : 0
            );
        } else {
            setCurrentImageIndex((prev) =>
                prev > 0 ? prev - 1 : (profile.images?.length || 1) - 1
            );
        }
    };

    const images = profile.images && profile.images.length > 0 ? profile.images : ["https://placehold.co/600x800?text=No+Image"];

    const getImageUrl = (index: number) => {
        const baseUrl = images[index];
        const buster = cacheBuster[index];
        if (!buster) return baseUrl;

        const url = new URL(baseUrl);
        url.searchParams.set("t", buster);
        return url.toString();
    };

    const currentImageUrl = getImageUrl(currentImageIndex);
    const isErrored = imageError[currentImageIndex];

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
            dragElastic={0.7} // バネのような抵抗感を追加
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            animate={exitX ? { x: exitX, opacity: 0 } : { x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }} // バネ物理挙動
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing bg-white rounded-3xl shadow-xl overflow-hidden select-none"
        >
            {/* 画像 */}
            <div className="relative h-full w-full bg-gray-200 flex items-center justify-center">
                {isActive ? (
                    <>
                        {!isErrored ? (
                            <img
                                key={`${currentImageIndex}-${cacheBuster[currentImageIndex]}`}
                                src={currentImageUrl}
                                alt={profile.name}
                                className="h-full w-full object-cover pointer-events-none"
                                draggable={false}
                                onError={() => handleImageError(currentImageIndex)}
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-4 p-6 text-center">
                                <span className="text-gray-500 font-medium">Image Load Error</span>
                                <button
                                    onClick={handleManualRetry}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full shadow-sm hover:bg-white transition-colors text-slate-800 font-bold z-30"
                                >
                                    <RefreshCw size={18} />
                                    Retry
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-gray-400 font-medium animate-pulse">Loading...</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />

                {/* 画像インジケーター */}
                {images.length > 1 && (
                    <div className="absolute top-2 left-0 right-0 flex gap-1 px-2 z-20">
                        {images.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1 flex-1 rounded-full shadow-sm ${index === currentImageIndex ? 'bg-white' : 'bg-white/40'}`}
                            />
                        ))}
                    </div>
                )}

                {/* タップエリア (左/右) - ドラッグと干渉しないようにTouchStart等は親に任せ、Clickで判定 */}
                <div className="absolute inset-0 flex z-10">
                    <div
                        className="w-1/2 h-full"
                        onClick={(e) => handleTap(e, "prev")}
                        onTouchEnd={(e) => e.stopPropagation()}
                    />
                    <div
                        className="w-1/2 h-full"
                        onClick={(e) => handleTap(e, "next")}
                        onTouchEnd={(e) => e.stopPropagation()}
                    />
                </div>

                {/* Like印 */}
                {(isDragging || exitX) && (
                    <motion.div
                        style={{ opacity: likeOpacity }}
                        className="absolute top-10 left-6 border-[6px] border-green-400 rounded-lg px-4 py-1 rotate-[-15deg] z-20"
                    >
                        <span className="text-4xl font-extrabold text-green-400 uppercase tracking-widest">LIKE</span>
                    </motion.div>
                )}

                {/* Nope印 */}
                {(isDragging || exitX) && (
                    <motion.div
                        style={{ opacity: nopeOpacity }}
                        className="absolute top-10 right-6 border-[6px] border-rose-500 rounded-lg px-4 py-1 rotate-[15deg] z-20"
                    >
                        <span className="text-4xl font-extrabold text-rose-500 uppercase tracking-widest">NOPE</span>
                    </motion.div>
                )}

                {/* テキスト情報 (オーバーレイ) */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white pb-8 z-10 pointer-events-none">
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
