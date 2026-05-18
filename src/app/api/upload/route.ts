import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdminApi } from "@/lib/admin/auth";

export const runtime = "nodejs";

const maxImageBytes = 5 * 1024 * 1024;
const maxVideoBytes = 100 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json({ error: "Cloudinary environment variables are missing" }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Image or video file is required" }, { status: 400 });
  const isImage = allowedTypes.includes(file.type);
  const isVideo = allowedVideoTypes.includes(file.type);
  if (!isImage && !isVideo) return NextResponse.json({ error: "Only JPG, PNG, WEBP, GIF, MP4, WEBM, and MOV files are allowed" }, { status: 400 });
  if (isImage && file.size > maxImageBytes) return NextResponse.json({ error: "Image max size is 5MB" }, { status: 400 });
  if (isVideo && file.size > maxVideoBytes) return NextResponse.json({ error: "Video max size is 100MB" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await new Promise<{ secure_url: string; public_id: string; resource_type: "image" | "video" }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "central-market",
        resource_type: isVideo ? "video" : "image",
      },
      (error, uploadResult) => {
        if (error || !uploadResult) reject(error);
        else resolve({ secure_url: uploadResult.secure_url, public_id: uploadResult.public_id, resource_type: isVideo ? "video" : "image" });
      },
    );
    stream.end(buffer);
  });

  return NextResponse.json({
    secure_url: result.secure_url,
    public_id: result.public_id,
    resource_type: result.resource_type,
  });
}
