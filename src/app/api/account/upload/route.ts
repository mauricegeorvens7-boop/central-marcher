import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireUser } from "@/lib/admin/auth";

export const runtime = "nodejs";

const maxBytes = 5 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(request: NextRequest) {
  await requireUser();

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json({ error: "Cloudinary environment variables are missing" }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  if (!allowedTypes.includes(file.type)) return NextResponse.json({ error: "Only JPG, PNG, WEBP, and GIF images are allowed" }, { status: 400 });
  if (file.size > maxBytes) return NextResponse.json({ error: "Image max size is 5MB" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "central-market/account", resource_type: "image" },
      (error, uploadResult) => {
        if (error || !uploadResult) reject(error);
        else resolve({ secure_url: uploadResult.secure_url, public_id: uploadResult.public_id });
      },
    );
    stream.end(buffer);
  });

  return NextResponse.json({ secure_url: result.secure_url, public_id: result.public_id });
}
