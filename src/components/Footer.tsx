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
    <footer className="mt-10 border-t border-slate-200 bg-slate-950 text-white md:mt-16">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 md:grid-cols-[1.2fr_2fr] md:gap-8 md:py-10">
        <div>
          <div className="relative mb-3 h-12 w-28 overflow-hidden md:h-16 md:w-36">
            <Image
              src="/central-marcher-logo-footer.png"
              alt="Central Marcher"
              fill
              sizes="144px"
              className="object-contain object-left"
            />
          </div>
          <p className="max-w-sm text-xs leading-5 text-slate-300 md:text-sm md:leading-6">
            A modern commerce platform for physical products, pickup, delivery, sellers, support, and admin operations.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-sm font-bold">{group.title}</h3>
              <div className="space-y-1.5 md:space-y-2">
                {group.links.map((link) => (
                  <Link key={link} href="#" className="block text-xs text-slate-300 hover:text-white md:text-sm">
                    {link}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-800 px-4 py-3 text-center text-[11px] text-slate-400 md:py-4 md:text-xs">
        Built as an original demo platform. No third-party brand assets copied.
      </div>
    </footer>
  );
}
