/** @type {import('next').NextConfig} */
module.exports = {
  experimental: {
    // xlsx dùng ở server, không cần bundle
    serverComponentsExternalPackages: ['xlsx'],
    // đảm bảo data/account.xlsx được đóng gói cùng serverless function trên Vercel
    outputFileTracingIncludes: { '/**/*': ['./data/**/*'] },
  },
};
