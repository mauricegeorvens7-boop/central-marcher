import { SellerShell } from "@/components/seller/SellerShell";
import { SellerProfileForm } from "@/components/seller/SellerProfileForm";
import { requireSeller } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function SellerProfilePage() {
  const { seller } = await requireSeller();
  return (
    <SellerShell seller={seller} title="Profil vendeur">
      <SellerProfileForm seller={seller} />
    </SellerShell>
  );
}
