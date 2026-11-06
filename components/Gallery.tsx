"use client";

import { useState } from "react";
import { PackageSearch } from "lucide-react";

export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="card grid aspect-square place-items-center text-slate-300">
        <PackageSearch size={56} strokeWidth={1.25} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div>
      <div className="card aspect-square overflow-hidden bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[i]} alt={alt} className="h-full w-full object-contain p-4" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, idx) => (
            <button
              key={src}
              onClick={() => setI(idx)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white ${
                idx === i ? "border-brand-500" : "border-transparent"
              }`}
              aria-label={`Image ${idx + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
