import QRCode from 'qrcode';

/**
 * Gera um QR code como data URL (imagem)
 * @param {string} text - Texto para codificar no QR code
 * @param {object} options - Opções do QR code
 * @returns {Promise<string>} Data URL da imagem do QR code
 */
export async function generateQRCode(text, options = {}) {
  const defaultOptions = {
    width: 300, // Tamanho maior para melhor qualidade
    margin: 4, // Margem maior para melhor leitura
    errorCorrectionLevel: 'H', // Nível alto de correção de erro (30% de dados podem ser recuperados)
    color: {
      dark: '#000000', // Preto sólido
      light: '#FFFFFF' // Branco sólido
    },
    ...options
  };

  try {
    const dataUrl = await QRCode.toDataURL(text, defaultOptions);
    return dataUrl;
  } catch (error) {
    console.error('Erro ao gerar QR code:', error);
    throw error;
  }
}
