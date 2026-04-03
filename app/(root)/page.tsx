'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';
import {useAuth} from '@/context/AuthContext';

const Home = () =>
{
    const {isAuthenticated, isHydrated} = useAuth();

    return (
        <div className={styles.intro}>
            <div className={styles.navbar}>
                <Image
                    src="/logo.png"
                    alt="Logo"
                    width={200}
                    height={70}
                    style={{objectFit: 'cover', position: 'absolute', top: 50, left: 50}}
                    priority
                />
            </div>
            <div className={styles.container}>
                <div className={styles.left}>
                    <h1>Bienvenido a LegalDocs, la plataforma ideal para gestionar tus documentos.</h1>
                    {isHydrated && (
                        isAuthenticated ? (
                            <Link href="/dashboard">
                                <span>Ir al Dashboard</span>
                            </Link>
                        ) : (
                            <Link href="/signin">
                                <span>Inicia Sesión</span>
                            </Link>
                        )
                    )}
                </div>
                <div className={styles.right}>
                    <Image
                        src="/bglogin.png"
                        width={500}
                        height={50}
                        style={{objectFit: 'cover'}}
                        alt="bg"
                        priority
                    />
                </div>
            </div>
        </div>
    );
};

export default Home;
