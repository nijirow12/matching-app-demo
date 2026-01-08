export interface Profile {
    id: string;
    name: string;
    age: number;
    bio: string;
    images: string[];
    distanceKm: number;
}

export const MOCK_PROFILES: Profile[] = [
    {
        id: "1",
        name: "Sakura",
        age: 24,
        bio: "カフェ巡りが好きです☕️ よろしくお願いします！",
        images: ["https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop"],
        distanceKm: 3,
    },
    {
        id: "2",
        name: "Kaito",
        age: 27,
        bio: "休日はフットサルしてます⚽️ 飲みに行ける友達募集中。",
        images: ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop"],
        distanceKm: 5,
    },
    {
        id: "3",
        name: "Yui",
        age: 22,
        bio: "映画と旅行が趣味です✈️ 最近はネトフリばかり見てます笑",
        images: ["https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop"],
        distanceKm: 12,
    },
    {
        id: "4",
        name: "Ren",
        age: 29,
        bio: "エンジニアやってます💻 ガジェット好きの方語りましょう！",
        images: ["https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop"],
        distanceKm: 8,
    },
];
