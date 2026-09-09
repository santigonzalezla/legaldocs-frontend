'use client';

import Image from 'next/image';
import {ReactNode, useEffect, useState} from 'react';
import styles from './identityimage.module.css';

interface IdentityImageProps
{
    src:        string | null;
    fallback:   ReactNode;
    width:      number;
    height:     number;
    radius:     number | string;
    alt?:       string;
    objectFit?: 'cover' | 'contain';
    className?: string;
}

const IdentityImage = ({src, fallback, width, height, radius, alt = '', objectFit = 'cover', className = ''}: IdentityImageProps) =>
{
    const [failed, setFailed] = useState(false);

    useEffect(() => { setFailed(false); }, [src]);

    const borderRadius = typeof radius === 'number' ? `${radius}px` : radius;

    if (!src || failed)
        return <div className={`${styles.fallback} ${className}`} style={{width, height, borderRadius}}>{fallback}</div>;

    // La imagen se sirve tras un 302 a una URL prefirmada que rota en cada request:
    // `unoptimized` evita el optimizador de Next (que además exigiría allow-list del host).
    return (
        <Image
            className={`${styles.image} ${className}`}
            style={{borderRadius, objectFit}}
            src={src}
            alt={alt}
            width={width}
            height={height}
            unoptimized
            onError={() => setFailed(true)}
        />
    );
};

export default IdentityImage;
