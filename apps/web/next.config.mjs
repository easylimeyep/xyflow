/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@flow/ui",
    "@flow/flow",
    "@flow/expression-editor",
  ],
}

export default nextConfig
