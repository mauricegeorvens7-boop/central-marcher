"use client";

import Image from "next/image";
import { ChangeEvent, useState } from "react";

function inferMediaType(url: string): "image" | "video" {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) ? "video" : "image";
}

export function ImageUploadField({
  label,
  value,
  onChange,
  accept = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime",
}: {
  label: string;
  value: string;
  onChange: (payload: { url: string; publicId?: string | null; mediaType?: "image" | "video" }) => void;
  accept?: string;
}) {
  const [preview, setPreview] = useState(value);
  const [previewType, setPreviewType] = useState<"image" | "video">(inferMediaType(value));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setPreviewType(file.type.startsWith("video/") ? "video" : "image");
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    setLoading(false);
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Upload failed");
      return;
    }
    setPreview(data.secure_url);
    setPreviewType(data.resource_type === "video" ? "video" : "image");
    onChange({ url: data.secure_url, publicId: data.public_id, mediaType: data.resource_type === "video" ? "video" : "image" });
  }

  return (
    <div className="grid gap-2">
      <label className="text-sm font-bold">{label}</label>
      {preview && (
        <div className="relative h-36 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
          {previewType === "video" ? (
            <video src={preview} className="h-full w-full object-cover" controls muted playsInline />
          ) : (
            <Image src={preview} alt="Preview" fill className="object-cover" sizes="400px" />
          )}
        </div>
      )}
      <input className="field pt-2" type="file" accept={accept} onChange={upload} />
      {loading && <p className="text-sm text-slate-600">Upload vers Cloudinary...</p>}
      {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}
