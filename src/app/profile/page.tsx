"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser, SignOutButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";

export default function ProfilePage() {
    const { getToken } = useAuth();
    const { user, isLoaded } = useUser();
    const router = useRouter();

    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [bio, setBio] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    // 既存のプロフィールがあれば読み込む
    useEffect(() => {
        const loadProfile = async () => {
            if (!isLoaded || !user) return;

            const token = await getToken({ template: "supabase" });
            const supabase = createSupabaseClient(token);

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (data) {
                setName(data.name || "");
                setAge(data.age?.toString() || "");
                setBio(data.bio || "");
                setImages(data.images || []);
            }
        };

        loadProfile();
    }, [isLoaded, user, getToken]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        if (!user) return;

        try {
            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const token = await getToken({ template: "supabase" });
            const supabase = createSupabaseClient(token);

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 公開URLを取得
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setImages((prev) => [...prev, publicUrl]);
        } catch (error: any) {
            console.error(error);
            alert('画像のアップロードに失敗しました');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setMessage("");

        try {
            const token = await getToken({ template: "supabase" });
            const supabase = createSupabaseClient(token);

            const updates = {
                id: user.id,
                name,
                age: parseInt(age),
                bio,
                images, // 画像配列を保存
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from("profiles").upsert(updates);

            if (error) {
                throw error;
            }

            setMessage("プロフィールを保存しました！");
            // 保存成功したらホームへ (任意)
            setTimeout(() => router.push("/"), 1000);
        } catch (error: any) {
            console.error(error);
            setMessage("エラーが発生しました: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // ... (previous state and hooks)

    const handleSignOut = async () => {
        // ClerkのSignOutButtonなどを使うか、useClerk().signOut()
        // ここではLayoutにUserButtonがないため、手動ログアウトボタンを用意
    };

    if (!isLoaded) return <div className="p-8 text-center text-rose-500">Loading...</div>;

    const currentProfile = {
        id: user?.id || "preview",
        name: name || "Your Name",
        age: parseInt(age) || 20,
        bio: bio || "Your biography here...",
        images: images.length > 0 ? images : ["https://placehold.co/600x800?text=No+Image"],
        distanceKm: 0,
    };

    return (
        <div className="min-h-screen pb-20">
            <div className="max-w-md mx-auto p-4 flex flex-col items-center gap-8">

                {/* Preview Section */}
                <div className="w-full flex flex-col items-center">
                    <h2 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-4">Preview</h2>
                    <div className="relative w-full h-[500px] pointer-events-none transform scale-95 origin-top">
                        {/* SwipeCardを再利用するが、Drag無効化などはComponent側で制御必要。
                     今回は簡易的に同じものを使うが、SwipeCardに readonly propsを追加するのが理想。
                     ここでは drag="x" があるので動いてしまうが、previewとしては許容範囲。
                 */}
                        <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl bg-white">
                            <img
                                src={currentProfile.images[0]}
                                className="w-full h-full object-cover"
                                alt="preview"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                            <div className="absolute bottom-0 left-0 p-6 text-white">
                                <div className="flex items-baseline gap-2">
                                    <h1 className="text-3xl font-bold">{currentProfile.name}</h1>
                                    <span className="text-xl font-medium">{currentProfile.age}</span>
                                </div>
                                <p className="mt-2 text-sm text-gray-100 line-clamp-2">{currentProfile.bio}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold mb-6 text-gray-800">Edit Profile</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Images */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Photos</label>
                            <div className="grid grid-cols-3 gap-3">
                                {images.map((url, idx) => (
                                    <div key={idx} className="relative aspect-[3/4] rounded-lg overflow-hidden group">
                                        <img src={url} alt="profile" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ✕
                                        </button>
                                        {idx === 0 && <span className="absolute bottom-1 left-1 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">MAIN</span>}
                                    </div>
                                ))}
                                {images.length < 6 && (
                                    <label className="relative aspect-[3/4] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-rose-300 transition-all group">
                                        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">+</div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all bg-gray-50 text-gray-800 font-medium"
                                    placeholder="Enter your name"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Age</label>
                                <input
                                    type="number"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all bg-gray-50 text-gray-800 font-medium"
                                    placeholder="25"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About Me</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={4}
                                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-500 outline-none transition-all resize-none text-sm leading-relaxed text-gray-800"
                                    placeholder="I like coffee and traveling..."
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? "Saving..." : "Save Profile"}
                        </button>
                    </form>
                </div>

                {message && (
                    <p className={`text-center text-sm mt-4 ${message.includes("エラー") ? "text-red-500" : "text-green-500"}`}>
                        {message}
                    </p>
                )}

                {/* Sign Out Area */}
                <div className="w-full flex justify-center pb-8">
                    <div className="text-gray-400 text-sm font-medium hover:text-gray-600 cursor-pointer transition-colors">
                        <SignOutButton>Sign Out</SignOutButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
