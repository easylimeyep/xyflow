/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@workspace/ui",
    "@workspace/flow",
    "@workspace/expression-editor",
  ],
}

export default nextConfig
