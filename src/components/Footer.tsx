import Image from "next/image";
import Link from "next/link";

const groups = [
  { title: "Shop", links: ["Deals", "Open Box", "Marketplace", "Gift cards"] },
  { title: "Services", links: ["Delivery & pickup", "Protection plans", "Financing", "Returns"] },
  { title: "Support", links: ["Contact", "Order status", "Warranty", "Help center"] },
  { title: "Company", links: ["About", "Careers", "Sellers", "Privacy"] },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_2fr]">
        <div>
          <div className="relative mb-4 h-16 w-36 overflow-hidden">
            <Image
              src="/central-marcher-logo-footer.png"
              alt="Central Marcher"
              fill
              sizes="144px"
              className="object-contain object-left"
            />
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-300">
            A modern commerce platform for physical products, pickup, delivery, sellers, support, and admin operations.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-3 text-sm font-bold">{group.title}</h3>
              <div className="space-y-2">
                {group.links.map((link) => (
                  <Link key={link} href="#" className="block text-sm text-slate-300 hover:text-white">
                    {link}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-400">
        Built as an original demo platform. No third-party brand assets copied.
      </div>
    </footer>
  );
}
