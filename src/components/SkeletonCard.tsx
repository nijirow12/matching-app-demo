export function SkeletonCard() {
    return (
        <div className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-xl overflow-hidden animate-pulse">
            <div className="relative h-full w-full bg-gray-200">
                {/* Gradient Overlay Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />

                {/* Text Information Placeholders */}
                <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 z-10">
                    <div className="flex items-baseline gap-3 mb-2">
                        {/* Name Placeholder */}
                        <div className="h-8 w-40 bg-gray-300 rounded-md" />
                        {/* Age Placeholder */}
                        <div className="h-6 w-10 bg-gray-300 rounded-md" />
                    </div>
                    {/* Distance Placeholder */}
                    <div className="flex items-center gap-1 mb-4">
                        <div className="h-4 w-24 bg-gray-300 rounded-md" />
                    </div>
                    {/* Bio Placeholder - Multiple lines */}
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-gray-300 rounded-md" />
                        <div className="h-4 w-5/6 bg-gray-300 rounded-md" />
                        <div className="h-4 w-4/6 bg-gray-300 rounded-md" />
                    </div>
                </div>
            </div>
        </div>
    );
}
