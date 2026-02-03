import jsPDF from 'jspdf';
import { generateQRCode } from '../utils/qrCodeGenerator.js';
import { calcularDiaRodizio } from '../utils/rodizioUtils.js';

/**
 * Converte SVG para PNG usando canvas
 */
async function svgToPng(svgString) {
  return new Promise((resolve, reject) => {
    try {
      // Criar um parser para ler o SVG e extrair dimensões
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;
      
      // Obter dimensões do SVG (viewBox ou width/height)
      let width = 232.74; // Dimensões padrão do logo
      let height = 229.72;
      
      const viewBox = svgElement.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(' ');
        if (parts.length >= 4) {
          width = parseFloat(parts[2]);
          height = parseFloat(parts[3]);
        }
      } else {
        const svgWidth = svgElement.getAttribute('width');
        const svgHeight = svgElement.getAttribute('height');
        if (svgWidth) width = parseFloat(svgWidth.replace('mm', '')) * 3.779527559; // Converter mm para pixels
        if (svgHeight) height = parseFloat(svgHeight.replace('mm', '')) * 3.779527559;
      }
      
      // Criar imagem
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Usar dimensões maiores para melhor qualidade
        const scale = 2;
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(error);
      };
      
      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Carrega uma imagem e retorna como base64
 */
async function loadImageAsBase64(url) {
  try {
    // Se já for data URL, retornar diretamente
    if (url.startsWith('data:')) {
      return url;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Se for SVG, converter para PNG
    if (url.endsWith('.svg') || response.headers.get('content-type')?.includes('svg')) {
      const svgText = await response.text();
      return await svgToPng(svgText);
    }
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Erro ao carregar imagem:', error);
    return null;
  }
}

/**
 * Desenha um checkbox no PDF
 */
function drawCheckbox(doc, x, y, size = 4, checked = false) {
  // Desenhar quadrado
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(x, y - size, size, size);
  
  // Se marcado, desenhar X
  if (checked) {
    doc.setLineWidth(1);
    doc.line(x + 0.5, y - size + 0.5, x + size - 0.5, y - 0.5);
    doc.line(x + size - 0.5, y - size + 0.5, x + 0.5, y - 0.5);
  }
}

/**
 * Gera PDF do cronograma de instalação
 * @param {object} cronograma - Dados do cronograma
 * @param {string} logoUrl - URL do logo (opcional)
 * @returns {Promise<void>}
 */
export async function generateCronogramaPDF(cronograma, logoUrl = null) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Função para adicionar nova página se necessário
  const checkPageBreak = (requiredHeight) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Função para adicionar texto com quebra de linha
  const addText = (text, x, y, maxWidth, fontSize = 10, fontStyle = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return lines.length * (fontSize * 0.4);
  };

  // Cabeçalho com duas colunas
  const headerHeight = 50;
  const logoColWidth = pageWidth * 0.2; // Reduzido de 30% para 20%
  const infoColWidth = pageWidth * 0.8 - margin * 2; // Aumentado de 70% para 80%
  const infoColX = logoColWidth + margin;

  // Coluna esquerda - Logo (30%)
  if (logoUrl) {
    try {
      const logoBase64 = await loadImageAsBase64(logoUrl);
      if (logoBase64) {
        // Determinar formato da imagem
        let format = 'PNG';
        if (logoBase64.includes('data:image/jpeg') || logoBase64.includes('data:image/jpg')) {
          format = 'JPEG';
        }
        
        try {
          // Adicionar logo ao PDF
          // Manter proporção do logo
          const logoAspectRatio = 28 / 27.7012; // width / height do SVG original
          const logoHeight = headerHeight;
          const logoWidth = logoHeight * logoAspectRatio;
          const logoX = margin;
          const logoY = yPosition;
          
          // Se o logo for muito largo, ajustar
          const maxLogoWidth = logoColWidth - margin;
          const finalLogoWidth = logoWidth > maxLogoWidth ? maxLogoWidth : logoWidth;
          const finalLogoHeight = finalLogoWidth / logoAspectRatio;
          
          doc.addImage(logoBase64, format, logoX, logoY, finalLogoWidth, finalLogoHeight);
        } catch (imgError) {
          console.warn('Erro ao adicionar logo ao PDF:', imgError);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar logo:', error);
    }
  }

  // Coluna direita - Informações e QR Code (70%)
  let infoY = yPosition;
  
  // Título
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Cronograma de Instalação', infoColX, infoY);
  infoY += 7;

  // OS
  if (cronograma.os_manual) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`OS: ${cronograma.os_manual}`, infoColX, infoY);
    infoY += 6;
  }

  // Data
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dataInicio = cronograma.data_instalacao 
    ? new Date(cronograma.data_instalacao).toLocaleDateString('pt-BR')
    : 'Não informada';
  const dataTermino = cronograma.data_termino
    ? new Date(cronograma.data_termino).toLocaleDateString('pt-BR')
    : '';
  const dataTexto = dataTermino ? `${dataInicio} - ${dataTermino}` : dataInicio;
  const horaTexto = cronograma.hora_inicio 
    ? ` às ${cronograma.hora_inicio}${cronograma.hora_fim ? ` - ${cronograma.hora_fim}` : ''}`
    : '';
  doc.text(`Data: ${dataTexto}${horaTexto}`, infoColX, infoY);
  infoY += 5;

  // Endereço
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Endereço:', infoColX, infoY);
  infoY += 5;
  doc.setFont('helvetica', 'normal');
  // Mais espaço para endereço agora que a coluna de informações é maior
  const enderecoLines = doc.splitTextToSize(cronograma.endereco || 'Não informado', infoColWidth - 60);
  doc.text(enderecoLines, infoColX, infoY);
  infoY += enderecoLines.length * 4 + 3;

  // QR Code do Google Maps (ao lado das informações)
  if (cronograma.latitude && cronograma.longitude) {
    const googleMapsUrl = `https://www.google.com/maps?q=${cronograma.latitude},${cronograma.longitude}`;
    
    try {
      const qrCodeDataUrl = await generateQRCode(googleMapsUrl, { width: 40 });
      const qrX = infoColX + infoColWidth - 45;
      const qrY = infoY - 35; // Posicionar próximo ao endereço
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, 40, 40);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text('Escaneie para', qrX, qrY + 42, { align: 'center', maxWidth: 40 });
      doc.text('abrir no Maps', qrX, qrY + 46, { align: 'center', maxWidth: 40 });
    } catch (error) {
      console.error('Erro ao gerar QR code:', error);
    }
  }

  yPosition += headerHeight + 10;
  checkPageBreak(20);

  // Equipes Escaladas
  if (cronograma.equipes && cronograma.equipes.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Equipes Escaladas:', margin, yPosition);
    yPosition += 8;

    cronograma.equipes.forEach((equipe) => {
      checkPageBreak(15);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${equipe.nome}`, margin + 5, yPosition);
      yPosition += 6;

      if (equipe.funcionarios && equipe.funcionarios.length > 0) {
        equipe.funcionarios.forEach((funcionario) => {
          checkPageBreak(6);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          const funcionarioText = `  - ${funcionario.nome}${funcionario.cargo ? ` (${funcionario.cargo})` : ''}`;
          doc.text(funcionarioText, margin + 10, yPosition);
          yPosition += 5;
        });
      }
      yPosition += 3;
    });
    yPosition += 3;
  }

  checkPageBreak(20);

  // Checklist de Materiais
  if (cronograma.materiais && cronograma.materiais.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Checklist de Materiais:', margin, yPosition);
    yPosition += 8;

    for (const material of cronograma.materiais) {
      checkPageBreak(25);
      const checkboxX = margin + 5;
      const checkboxY = yPosition;
      const textX = checkboxX + 8;
      const imageSize = 20;
      
      // Checkbox
      const confirmado = material.quantidade_confirmada || 0;
      const quantidade = material.quantidade_necessaria || 1;
      const isChecked = confirmado >= quantidade;
      drawCheckbox(doc, checkboxX, checkboxY, 4, isChecked);
      
      // Imagem do material (se houver)
      if (material.imagem_url) {
        try {
          const imgBase64 = await loadImageAsBase64(material.imagem_url);
          if (imgBase64) {
            doc.addImage(imgBase64, 'PNG', pageWidth - margin - imageSize, checkboxY - imageSize, imageSize, imageSize);
          }
        } catch (error) {
          console.error('Erro ao carregar imagem do material:', error);
        }
      }
      
      // Texto do material
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const quantidadeText = `${quantidade} ${material.unidade || 'un'}`;
      const confirmadoText = confirmado > 0 ? ` (${confirmado} confirmado${confirmado > 1 ? 's' : ''})` : '';
      const materialText = `${material.nome} - ${quantidadeText}${confirmadoText}`;
      const maxTextWidth = pageWidth - textX - margin - imageSize - 5;
      const lines = doc.splitTextToSize(materialText, maxTextWidth);
      doc.text(lines, textX, checkboxY);
      yPosition += Math.max(lines.length * 5, imageSize + 2);
    }
    yPosition += 3;
  }

  checkPageBreak(20);

  // Checklist de Tarefas
  if (cronograma.todos && cronograma.todos.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Checklist:', margin, yPosition);
    yPosition += 8;

    cronograma.todos.forEach((todo) => {
      checkPageBreak(8);
      const checkboxX = margin + 5;
      const checkboxY = yPosition;
      const textX = checkboxX + 8;
      
      // Checkbox desenhado
      drawCheckbox(doc, checkboxX, checkboxY, 4, todo.concluido);
      
      // Texto da tarefa
      doc.setFontSize(10);
      doc.setFont('helvetica', todo.concluido ? 'italic' : 'normal');
      const maxTextWidth = pageWidth - textX - margin;
      const lines = doc.splitTextToSize(todo.descricao, maxTextWidth);
      doc.text(lines, textX, checkboxY);
      yPosition += Math.max(lines.length * 5, 6);
    });
    yPosition += 3;
  }

  checkPageBreak(20);

  // Equipamentos
  if (cronograma.equipamentos && cronograma.equipamentos.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Equipamentos:', margin, yPosition);
    yPosition += 8;

    for (const equipamento of cronograma.equipamentos) {
      checkPageBreak(25);
      const imageSize = 20;
      const itemY = yPosition;
      
      // Imagem do equipamento (se houver)
      if (equipamento.imagem_url) {
        try {
          const imgBase64 = await loadImageAsBase64(equipamento.imagem_url);
          if (imgBase64) {
            doc.addImage(imgBase64, 'PNG', margin + 5, itemY - imageSize, imageSize, imageSize);
          }
        } catch (error) {
          console.error('Erro ao carregar imagem do equipamento:', error);
        }
      }
      
      // Texto do equipamento
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const tipo = equipamento.tipo === 'equipamento' ? 'Equipamento' : 'Ferramenta';
      const textX = equipamento.imagem_url ? margin + 5 + imageSize + 5 : margin + 5;
      const maxTextWidth = pageWidth - textX - margin;
      const equipamentoText = `${equipamento.nome} (${tipo})`;
      const lines = doc.splitTextToSize(equipamentoText, maxTextWidth);
      doc.text(lines, textX, itemY);
      yPosition += Math.max(lines.length * 5, imageSize + 2);
    }
    yPosition += 3;
  }

  checkPageBreak(20);

  // Veículos
  if (cronograma.carros && cronograma.carros.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Veículos:', margin, yPosition);
    yPosition += 8;

    for (const carro of cronograma.carros) {
      const imageSize = 30;
      const imageX = margin + 5;
      const textX = carro.imagem_url ? imageX + imageSize + 8 : margin + 5;
      const startY = yPosition;
      
      // Calcular altura total do texto primeiro
      let textHeight = 0;
      let currentTextY = startY;
      
      // Placa
      currentTextY += 5;
      textHeight += 5;
      
      // Modelo e marca
      const modeloText = `${carro.modelo || ''}${carro.marca ? ` - ${carro.marca}` : ''}${carro.ano ? ` (${carro.ano})` : ''}`;
      if (modeloText.trim()) {
        const maxTextWidth = pageWidth - textX - margin;
        const modeloLines = doc.splitTextToSize(modeloText, maxTextWidth);
        textHeight += modeloLines.length * 5;
      }
      
      // Status e Rodízio (etiquetas na mesma linha)
      textHeight += 4 + 6; // Espaço + altura das etiquetas
      
      // Altura total do item (imagem ou texto, o que for maior)
      const itemHeight = Math.max(imageSize, textHeight);
      
      // Verificar quebra de página antes de adicionar
      checkPageBreak(itemHeight + 5);
      
      // Ajustar yPosition se necessário após quebra de página
      const itemY = yPosition;
      
      // Imagem do veículo (se houver) - à esquerda, alinhada ao topo do texto
      if (carro.imagem_url) {
        try {
          const imgBase64 = await loadImageAsBase64(carro.imagem_url);
          if (imgBase64) {
            // Alinhar imagem ao topo do texto
            doc.addImage(imgBase64, 'PNG', imageX, itemY, imageSize, imageSize);
          }
        } catch (error) {
          console.error('Erro ao carregar imagem do veículo:', error);
        }
      }
      
      // Informações do veículo - começar no mesmo Y da imagem
      let textY = itemY;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const placaText = `Placa: ${carro.placa}`;
      doc.text(placaText, textX, textY);
      textY += 5;
      
      // Modelo e marca
      doc.setFont('helvetica', 'normal');
      if (modeloText.trim()) {
        const maxTextWidth = pageWidth - textX - margin;
        const modeloLines = doc.splitTextToSize(modeloText, maxTextWidth);
        doc.text(modeloLines, textX, textY);
        textY += modeloLines.length * 5;
      }
      
      // Status disponibilidade e Rodízio - Etiquetas
      textY += 4;
      
      // Etiqueta de disponibilidade
      const disponivelText = carro.disponivel ? "Disponível" : "✗ Indisponível";
      const disponivelColor = carro.disponivel ? [5, 95, 70] : [153, 27, 27];
      const disponivelBg = carro.disponivel ? [209, 250, 229] : [254, 226, 226];
      
      doc.setFontSize(8);
      const padding = 2;
      const textWidth = doc.getTextWidth(disponivelText);
      const badgeWidth = textWidth + padding * 2;
      const badgeHeight = 6;
      const badgeY = textY - badgeHeight;
      
      // Fundo da etiqueta de disponibilidade
      doc.setFillColor(disponivelBg[0], disponivelBg[1], disponivelBg[2]);
      doc.setDrawColor(disponivelColor[0], disponivelColor[1], disponivelColor[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(textX, badgeY, badgeWidth, badgeHeight, 1, 1, 'FD');
      
      // Texto da etiqueta de disponibilidade
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(disponivelColor[0], disponivelColor[1], disponivelColor[2]);
      doc.text(disponivelText, textX + padding, textY - 1);
      
      // Etiqueta de rodízio
      const rodizioInfo = calcularDiaRodizio(carro.placa);
      if (rodizioInfo && rodizioInfo.diaNome) {
        const rodizioX = textX + badgeWidth + 5;
        let rodizioText = rodizioInfo.diaNome;
        if (rodizioInfo.aviso) {
          rodizioText = `⚠️ HOJE - ${rodizioInfo.diaNome}`;
        }
        
        const rodizioColor = rodizioInfo.aviso ? [220, 38, 38] : [79, 70, 229];
        const rodizioBg = rodizioInfo.aviso ? [254, 226, 226] : [219, 234, 254];
        
        const rodizioTextWidth = doc.getTextWidth(rodizioText);
        const rodizioBadgeWidth = rodizioTextWidth + padding * 2;
        
        doc.setFillColor(rodizioBg[0], rodizioBg[1], rodizioBg[2]);
        doc.setDrawColor(rodizioColor[0], rodizioColor[1], rodizioColor[2]);
        doc.roundedRect(rodizioX, badgeY, rodizioBadgeWidth, badgeHeight, 1, 1, 'FD');
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(rodizioColor[0], rodizioColor[1], rodizioColor[2]);
        doc.text(rodizioText, rodizioX + padding, textY - 1);
      }
      
      doc.setTextColor(0, 0, 0);
      textY += 6;
      
      // Atualizar yPosition para o próximo item
      yPosition += itemHeight + 5;
    }
    yPosition += 3;
  }

  checkPageBreak(20);

  // Observações
  if (cronograma.observacoes) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', margin, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const obsHeight = addText(cronograma.observacoes, margin, yPosition, pageWidth - margin * 2, 10);
    yPosition += obsHeight + 5;
  }

  // Rodapé
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Gerar nome do arquivo
  const osText = cronograma.os_manual ? `_${cronograma.os_manual.replace(/\s+/g, '_')}` : '';
  const fileName = `Cronograma${osText}_${new Date().toISOString().split('T')[0]}.pdf`;

  // Salvar PDF
  doc.save(fileName);
}
