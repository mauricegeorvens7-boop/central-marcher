import { notFound } from "next/navigation";
import { dbProductToProduct } from "@/lib/adapters";
import { getProductBySlug, getProducts } from "@/lib/db";
import { ProductGrid } from "@/components/ProductGrid";
import { Section } from "@/components/Section";
import { ProductExperience } from "@/components/ProductExperience";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  return {
    title: product?.seoTitle || product?.name || "Product",
    description: product?.seoDescription || product?.shortDescription,
    keywords: product?.keywords || undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dbProduct = getProductBySlug(slug);
  if (!dbProduct) notFound();
  const currentProduct = dbProductToProduct(dbProduct);
  const products = getProducts().map(dbProductToProduct);
  const related = products.filter((item) => item.category === currentProduct.category && item.id !== currentProduct.id).slice(0, 4);

  return (
    <>
      <ProductExperience product={dbProduct} />
      <Section title="Related products">
        <ProductGrid products={related.length ? related : products.slice(0, 4)} />
      </Section>
    </>
  );
}
