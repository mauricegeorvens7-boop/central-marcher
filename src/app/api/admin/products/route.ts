import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { productSchema } from "@/lib/admin/validation";
import { getProducts, saveProduct } from "@/lib/db";

export async function GET() {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  return NextResponse.json({ products: await getProducts({ includeHidden: true }) });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;

  const parsed = productSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid product", issues: parsed.error.flatten() }, { status: 400 });

  return NextResponse.json({ product: await saveProduct(parsed.data) });
}
