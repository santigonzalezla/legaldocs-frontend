import {ReactNode} from 'react';
import Image from 'next/image';
import {ThemeProvider} from '@/context/ThemeContext';
import styles from './layout.module.css';

const benefits = [
    'Genera contratos y documentos legales en minutos',
    'Cumplimiento normativo colombiano garantizado',
    'Gestiona tu despacho desde un solo lugar',
];

export default function AuthLayout({children}: {children: ReactNode})
{
    return (
        <ThemeProvider>
            <div className={styles.wrapper}>
                <div className={styles.left}>
                    <div className={styles.leftContent}>
                        <div className={styles.hero}>
                            <h1 className={styles.heroTitle}>
                                Automatiza tu práctica legal
                            </h1>
                            <p className={styles.heroSubtitle}>
                                La plataforma diseñada para abogados colombianos que quieren trabajar más inteligente.
                            </p>
                            <ul className={styles.benefits}>
                                {benefits.map((b) => (
                                    <li key={b} className={styles.benefit}>
                                        <span className={styles.benefitDot} />
                                        {b}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className={styles.imageWrapper}>
                            <Image
                                src="/bglogin.png"
                                alt="Documentos legales"
                                width={430}
                                height={350}
                                className={styles.heroImage}
                                style={{objectFit: 'fill'}}
                                priority
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.right}>
                    {children}
                </div>
            </div>
        </ThemeProvider>
    );
}
