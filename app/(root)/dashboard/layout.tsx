import './dashboard.css';
import type {Metadata} from "next";
import {satoshi} from "@/app/fonts/satoshi";
import {APP_DESCRIPTION, APP_NAME, SERVER_URL} from "@/lib/constants";
import Sidebar from "@/app/components/dashboard/sidebar/Sidebar";
import Topbar from "@/app/components/dashboard/topbar/Topbar";
import AiAgent from "@/app/components/aiagent/AiAgent";
import {Suspense} from "react";
import {ThemeProvider} from "@/context/ThemeContext";
import {SearchProvider} from "@/context/SearchContext";
import {AuthGuard} from "@/app/components/auth/AuthGuard";
import FirmGuard from "@/app/components/auth/FirmGuard";

export const metadata: Metadata = {
    title: {
        template: `%s | ${APP_NAME}`,
        default: APP_NAME,
    },
    description: APP_DESCRIPTION,
    metadataBase: new URL(SERVER_URL),
};

export default function RootLayout({children}: Readonly<{ children: React.ReactNode;}>)
{
    return (
        <div className={`${satoshi.variable} antialiased fulldashboard`}>
            <ThemeProvider>
                <AuthGuard>
                    <FirmGuard>
                        <Suspense fallback={null}>
                            <Sidebar/>
                            <SearchProvider>
                                <div className="dashboardtop">
                                    <Topbar/>
                                    <div className="dashcontainer">
                                        {children}
                                    </div>
                                </div>
                                <AiAgent />
                            </SearchProvider>
                        </Suspense>
                    </FirmGuard>
                </AuthGuard>
            </ThemeProvider>
        </div>
    );
}