/** @type {import('next').NextConfig} */
const nextConfig = {
  // Was `ignoreBuildErrors: true`, which let real errors ship — a JSX syntax
  // error compiled cleanly through it earlier this week. The four errors it was
  // covering are fixed, so the build verifies again instead of hoping.
  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    // Keep this true. It is not a shortcut and it is not laziness.
    //
    // Every photograph in this app is a progress photo served from private
    // Vercel Blob through app/api/file/route.ts, which authenticates the Supabase
    // session cookie and then checks ownership before it streams a byte. The
    // Image Optimization API deliberately does not forward request headers to the
    // source URL, so an <Image src="/api/file?..."> would arrive at the route with
    // no cookie, get a 401, and render nothing. Next's own docs say to use
    // `unoptimized` for exactly this case.
    //
    // Nothing imports next/image today, so this flag currently changes nothing —
    // it is here as the guard for the day someone reaches for <Image> on a
    // progress photo and cannot work out why it renders blank.
    //
    // The real lever on photo weight is lib/photos/prepare.ts, which decides the
    // 1440px long edge at upload time. That is where to shrink them, not here.
    unoptimized: true,
  },
}

export default nextConfig
