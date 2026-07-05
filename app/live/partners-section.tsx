import Image from "next/image";

export function PartnersSection() {
  return (
    <section id="partners" className="bg-black px-4 pb-24 md:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-black leading-[1.1] text-white md:text-5xl">Our Partners</h2>
        </div>

        {/* Wellness Partner */}
        <div className="mb-14 text-center">
          <p className="mb-8 text-xs md:text-sm font-semibold uppercase tracking-[0.2em] text-white">
            Wellness Partner
          </p>
          <div className="flex justify-center">
            <div className="relative h-28 w-72 md:h-36 md:w-96">
              <Image
                src="/live/vitamode.png"
                alt="Vitamode"
                fill
                sizes="400px"
                className="object-contain"
              />
            </div>
          </div>
        </div>

        <div className="mb-6 h-px bg-white/10" />

        {/* Performance Nutrition Partner */}
        <div className="mb-14 text-center">
          <p className="mb-8 text-xs md:text-sm font-semibold uppercase tracking-[0.2em] text-white">
            Performance Nutrition Partner
          </p>
          <div className="flex justify-center">
            <div className="relative h-20 w-56 md:h-24 md:w-72">
              <Image
                src="/live/rule-one-protein.png"
                alt="Rule One Proteins"
                fill
                sizes="300px"
                className="object-contain"
              />
            </div>
          </div>
        </div>

        <div className="mb-6 h-px bg-white/10" />

        {/* Fitness Partners */}
        <div className="text-center">
          <p className="mb-8 text-xs md:text-sm font-semibold uppercase tracking-[0.2em] text-white">
            Fitness Partners
          </p>
          <div className="grid grid-cols-2 gap-6 md:flex md:flex-wrap md:items-center md:justify-center md:gap-12">
            <div className="relative h-14 w-full md:h-16 md:w-52">
              <Image
                src="/live/crossfit-train-blackbox.png"
                alt="CrossFit Train BlackBox"
                fill
                sizes="(max-width: 768px) 50vw, 220px"
                className="object-contain"
              />
            </div>
            <div className="relative h-14 w-full md:h-16 md:w-52">
              <Image
                src="/live/ho-cycle.png"
                alt="Ho Cycle"
                fill
                sizes="(max-width: 768px) 50vw, 220px"
                className="object-contain"
              />
            </div>
            <div className="relative h-14 w-full md:h-16 md:w-52">
              <Image
                src="/live/retune-pilates.png"
                alt="Retune Physiotherapy & Pilates"
                fill
                sizes="(max-width: 768px) 50vw, 220px"
                className="object-contain"
              />
            </div>
            <div className="relative h-14 w-full md:h-16 md:w-52">
              <Image
                src="/live/move-private-fitness.png"
                alt="Move Private Fitness"
                fill
                sizes="(max-width: 768px) 50vw, 220px"
                className="object-contain"
              />
            </div>
            <div className="relative h-14 w-full md:h-16 md:w-52">
              <Image
                src="/live/amazfit.png"
                alt="Amazfit"
                fill
                sizes="(max-width: 768px) 50vw, 220px"
                className="object-contain"
              />
            </div>
            <div className="relative h-14 w-full md:h-16 md:w-52">
              <Image
                src="/live/livlola.png"
                alt="Livlola"
                fill
                sizes="(max-width: 768px) 50vw, 220px"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
