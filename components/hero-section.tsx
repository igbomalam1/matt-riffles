import Image from "next/image"

export function HeroSection() {
  return (
    <section className="relative w-full">
      <div className="relative w-full aspect-[4/3] md:aspect-[16/9] max-w-[1920px] mx-auto overflow-hidden">
        <Image
          src="/images/hero-main.jpg"
          alt="Matt performing comedy on stage"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>
    </section>
  )
}
