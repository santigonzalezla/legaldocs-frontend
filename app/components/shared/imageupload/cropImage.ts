export interface PixelArea
{
    x:      number;
    y:      number;
    width:  number;
    height: number;
}

const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) =>
    {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', () => reject(new Error('No se pudo cargar la imagen.')));
        image.crossOrigin = 'anonymous';
        image.src = src;
    });

export const getCroppedBlob = async (
    src: string,
    area: PixelArea,
    mimeType: string,
    aspect: number,
): Promise<Blob> =>
{
    const image  = await loadImage(src);
    const width  = Math.min(Math.round(area.width), 1024);
    const height = Math.round(width / aspect);

    const canvas  = document.createElement('canvas');
    canvas.width  = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('No se pudo procesar la imagen.');

    context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, width, height);

    return canvasToBlob(canvas, mimeType);
};

export const getFullImageBlob = async (src: string, mimeType: string): Promise<Blob> =>
{
    const image = await loadImage(src);
    const scale = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
    const width  = Math.round(image.naturalWidth  * scale);
    const height = Math.round(image.naturalHeight * scale);

    const canvas  = document.createElement('canvas');
    canvas.width  = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('No se pudo procesar la imagen.');

    context.drawImage(image, 0, 0, width, height);

    return canvasToBlob(canvas, mimeType);
};

const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string): Promise<Blob> =>
{
    const quality = mimeType === 'image/jpeg' ? 0.9 : undefined;

    return new Promise((resolve, reject) =>
        canvas.toBlob(
            blob => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen.'))),
            mimeType,
            quality,
        ),
    );
};
