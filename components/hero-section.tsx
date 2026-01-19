import Image from "next/image"

export function HeroSection() {
  return (
    <section className="relative w-full">
      <div className="relative w-full aspect-[9/16] md:aspect-[16/9] max-w-[1920px] mx-auto overflow-hidden bg-black max-h-[85vh]">
        <Image
          src="/images/hero-main.jpg"
          alt="Matt performing comedy on stage"
          fill
          priority
          className="object-contain md:object-cover"
          sizes="100vw"
        />
        {/* Gift Card CTA */}
        <div className="absolute bottom-8 right-8 z-20">
          <a
            href="https://www.bestbuy.com/site/electronics/gift-cards/cat09000.c?id=cat09000"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-2xl hover:bg-gold transition-all duration-300 border border-white/50"
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-black/60">Payment Ready?</span>
              <span className="text-sm font-bold text-black flex items-center gap-2">
                Buy Gift Cards at BestBuy.com <span className="text-lg">🛍️</span>
              </span>
            </div>
          </a>
        </div>
      </div>
    </section>
  )
}
