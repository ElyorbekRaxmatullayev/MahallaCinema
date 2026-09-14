"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { toggleFavorite } from "@/app/actions/user";

export default function FavoriteButton({ eventId, isFav }: { eventId: string, isFav: boolean }) {
  const [isFavorite, setIsFavorite] = useState(isFav);

  const handleClick = async () => {
    setIsFavorite(!isFavorite); // optimistic update
    const result = await toggleFavorite(eventId);
    if (!result.success) {
      setIsFavorite(isFavorite); // revert on failure
    }
  };

  return (
    <button 
      onClick={handleClick}
      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md z-10"
    >
      <Heart 
        size={18} 
        className={isFavorite ? "fill-[#e94553] text-[#e94553]" : "text-white"} 
      />
    </button>
  );
}
