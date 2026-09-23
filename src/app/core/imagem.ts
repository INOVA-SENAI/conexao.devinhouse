/** Corte quadrado central + reencode. Porte fiel de encolhe() do legado. */

export const LADO = 256;
export const QUALIDADE = 0.75;

/** A única parte com lógica — separada para rodar em jsdom, sem canvas. */
export const recorteQuadrado = (largura: number, altura: number) => {
  const lado = Math.min(largura, altura);
  return { sx: (largura - lado) / 2, sy: (altura - lado) / 2, lado };
};

/**
 * Devolve JPEG em base64 SEM o prefixo `data:` — é o formato que o Code.gs espera.
 * Reencodar em JPEG joga fora o EXIF da foto original, que carrega a localização.
 */
export const encolhe = async (arquivo: Blob): Promise<string> => {
  const img = await createImageBitmap(arquivo);
  const { sx, sy, lado } = recorteQuadrado(img.width, img.height);
  const c = document.createElement('canvas');
  c.width = c.height = LADO;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Não consegui preparar a imagem.');
  ctx.drawImage(img, sx, sy, lado, lado, 0, 0, LADO, LADO);
  img.close();
  return c.toDataURL('image/jpeg', QUALIDADE).split(',')[1];
};
