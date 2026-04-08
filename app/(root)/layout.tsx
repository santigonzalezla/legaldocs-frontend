import type {Metadata} from 'next';
import './globals.css';
import {APP_DESCRIPTION, APP_NAME, SERVER_URL} from '@/lib/constants';
import {ReactNode} from 'react';
import {satoshi} from '@/app/fonts/satoshi';
import {AuthProvider} from '@/context/AuthContext';
import {Toaster} from 'sonner';

export const metadata: Metadata = {
    title: {
        template: `%s | ${APP_NAME}`,
        default: APP_NAME,
    },
    description: APP_DESCRIPTION,
    metadataBase: new URL(SERVER_URL),
};

export default function RootLayout({children}: Readonly<{ children: ReactNode; }>)
{
    return (
        <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
            <body className={`${satoshi.variable} antialiased`}>
                <Toaster richColors position="top-right" />
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
