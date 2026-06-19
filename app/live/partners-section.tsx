import Image from "next/image";

const PARTNERS = [
  { name: "Vitamode", logo: "/live/vitamode.png" },
  { name: "Home Cycle", logo: "/live/home-cycle.png" },
];

export function PartnersSection() {
  return (
    <section id="partners" className="bg-black px-4 pb-24 md:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-black leading-[1.1] text-white md:text-5xl">
            Our Partners
          </h2>
        </div>

        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-12 md:gap-20">
          {PARTNERS.map((partner) => (
            <div
              key={partner.name}
              className="relative h-40 w-80 md:h-40 md:w-80"
            >
              <Image
                src={partner.logo}
                alt={partner.name}
                fill
                sizes="500px"
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
