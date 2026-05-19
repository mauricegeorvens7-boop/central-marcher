import { getCurrentUser } from "@/lib/admin/auth";
import { getAddressesForUser, getPaymentSettings } from "@/lib/db";
import { CheckoutClient } from "@/components/CheckoutClient";

export const metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const [settings, addresses] = await Promise.all([
    getPaymentSettings(),
    user ? getAddressesForUser(user.id) : Promise.resolve([]),
  ]);
  const defaultAddress = addresses[0] || null;
  return (
    <CheckoutClient
      settings={{
        moncashEnabled: Number(settings.moncashEnabled),
        moncashNumber: settings.moncashNumber,
        natcashEnabled: Number(settings.natcashEnabled),
        natcashNumber: settings.natcashNumber,
        cashOnDeliveryEnabled: Number(settings.cashOnDeliveryEnabled),
      }}
      user={user ? { name: user.name, email: user.email, phone: user.phone || "", balance: Number(user.balance || 0) } : null}
      defaultAddress={
        defaultAddress
          ? {
              line1: defaultAddress.line1,
              city: defaultAddress.city,
              province: defaultAddress.province,
              postalCode: defaultAddress.postalCode,
              phone: defaultAddress.phone || "",
            }
          : null
      }
    />
  );
}
