import { AccountSettingsClient } from "@/components/AccountSettingsClient";
import { requireUser } from "@/lib/admin/auth";
import { getAddressesForUser, getPaymentTransactionsForUser, getSupportTicketsForUser } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paramètres compte" };

export default async function AccountSettingsPage() {
  const user = await requireUser();
  const addresses = getAddressesForUser(user.id);
  const transactions = getPaymentTransactionsForUser(user.id);
  const tickets = getSupportTicketsForUser(user.id);

  return (
    <AccountSettingsClient
      user={{ ...user, balance: Number(user.balance) }}
      addresses={addresses.map((address) => ({ ...address, isDefault: Number(address.isDefault) }))}
      transactions={transactions.map((transaction) => ({ ...transaction, amount: Number(transaction.amount) }))}
      tickets={tickets.map((ticket) => ({ ...ticket }))}
    />
  );
}
