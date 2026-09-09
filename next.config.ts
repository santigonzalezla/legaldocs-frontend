import type { NextConfig } from "next";

const apiUrl = new URL(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api");

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
                hostname: apiUrl.hostname,
                port: apiUrl.port || undefined,
                pathname: "/api/files/**",
            },
        ],
    },
    turbopack: {
        rules: {
            '*.svg': {
                loaders: ['@svgr/webpack'],
                as: '*.js',
            },
        },
    },
    webpack(config) {
        const fileLoaderRule = config.module.rules.find(
            (rule: { test?: RegExp }) => rule.test?.test?.('.svg'),
        );
        if (fileLoaderRule) {
            fileLoaderRule.exclude = /\.svg$/;
        }
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        });
        return config;
    },
};

export default nextConfig;
