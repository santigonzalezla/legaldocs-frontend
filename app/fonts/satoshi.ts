import localFont from 'next/font/local';

const satoshi = localFont({
    src: [
        {
            path: './satoshi/Satoshi-Light.woff',
            weight: '300',
            style: 'normal',
        },
        {
            path: './satoshi/Satoshi-LightItalic.woff',
            weight: '300',
            style: 'italic',
        },
        {
            path: './satoshi/Satoshi-Regular.woff',
            weight: '400',
            style: 'normal',
        },
        {
            path: './satoshi/Satoshi-Italic.woff',
            weight: '400',
            style: 'italic',
        },
        {
            path: './satoshi/Satoshi-Medium.woff',
            weight: '500',
            style: 'normal',
        },
        {
            path: './satoshi/Satoshi-MediumItalic.woff',
            weight: '500',
            style: 'italic',
        },
        {
            path: './satoshi/Satoshi-Bold.woff',
            weight: '700',
            style: 'normal',
        },
        {
            path: './satoshi/Satoshi-BoldItalic.woff',
            weight: '700',
            style: 'italic',
        },
        {
            path: './satoshi/Satoshi-Black.woff',
            weight: '900',
            style: 'normal',
        },
        {
            path: './satoshi/Satoshi-BlackItalic.woff',
            weight: '900',
            style: 'italic',
        },
    ],
    variable: '--font-satoshi',
});


export { satoshi };