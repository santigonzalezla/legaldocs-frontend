import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
