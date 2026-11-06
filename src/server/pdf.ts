import { jsPDF } from 'jspdf';
import { Imovel, PlanoAcao, Checklist } from './db.js';

export function gerarPdfRelatorio(
  imovel: Imovel,
  plano: PlanoAcao,
  checklist: Checklist
): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // Colors
  const primaryColor = [15, 23, 42]; // slate-900
  const accentColor = [2, 132, 199]; // sky-600
  const successColor = [22, 101, 52]; // green-800
  const warningColor = [180, 83, 9]; // amber-700
  const borderColor = [226, 232, 240]; // slate-200
  const textColor = [30, 41, 59]; // slate-800
  const mutedColor = [100, 116, 139]; // slate-500

  // 1. Header Bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('saasCONSTRUCT · GESTÃO DE ADEQUAÇÃO', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('RELATÓRIO DE MONTAGEM DE MÓVEIS PLANEJADOS · MVP 1', margin, 18);

  const agoraFormatada = new Date().toLocaleString('pt-BR');
  doc.setFontSize(8);
  doc.text(`Emissão: ${agoraFormatada}`, pageWidth - margin - 50, 18);

  y = 36;

  // 2. Imóvel & Montador Information Card
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, y, pageWidth - margin * 2, 42, 2, 2, 'FD');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. DADOS DO IMÓVEL & CLIENTE', margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('Identificação:', margin + 4, y + 15);
  doc.text('Cliente (Comprador):', margin + 4, y + 22);
  doc.text('Endereço Completo:', margin + 4, y + 29);
  doc.text('Montador Responsável:', margin + 4, y + 36);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(imovel.identificacao, margin + 44, y + 15);
  doc.text(imovel.nome_cliente, margin + 44, y + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`${imovel.endereco} - ${imovel.cidade}/${imovel.estado}`, margin + 44, y + 29);
  doc.text(`${plano.nome_montador} · WhatsApp: ${plano.whatsapp_montador}`, margin + 44, y + 36);

  y += 48;

  // 3. Resumo de Execução do Checklist
  const itens = checklist.itens || [];
  const total = itens.length;
  const feitos = itens.filter((i) => i.status === 'feito').length;
  const pendentes = total - feitos;
  const taxaConclusao = total > 0 ? Math.round((feitos / total) * 100) : 0;

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'FD');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. RESUMO DO CHECKLIST (MODELO RESUMIDO)', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Total de Itens: ${total}`, margin + 4, y + 15);

  doc.setTextColor(successColor[0], successColor[1], successColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`✓ Concluídos: ${feitos}`, margin + 50, y + 15);

  doc.setTextColor(warningColor[0], warningColor[1], warningColor[2]);
  doc.text(`○ Pendentes: ${pendentes}`, margin + 95, y + 15);

  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(`Progresso Geral: ${taxaConclusao}%`, margin + 140, y + 15);

  y += 28;

  // 4. Tabela de Itens de Montagem
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. DETALHAMENTO DOS ITENS DE MONTAGEM', margin, y);
  y += 5;

  // Table Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  doc.text('Nº', margin + 2, y + 5.5);
  doc.text('Descrição do Móvel', margin + 10, y + 5.5);
  doc.text('Ambiente', margin + 74, y + 5.5);
  doc.text('Ferramentas', margin + 105, y + 5.5);
  doc.text('Previsto', margin + 140, y + 5.5);
  doc.text('Status', margin + 160, y + 5.5);

  y += 8;

  // Table Rows
  itens.forEach((it, index) => {
    if (y > pageHeight - 35) {
      doc.addPage();
      y = margin;
      // Repeat header on new page
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Nº', margin + 2, y + 5.5);
      doc.text('Descrição do Móvel', margin + 10, y + 5.5);
      doc.text('Ambiente', margin + 74, y + 5.5);
      doc.text('Ferramentas', margin + 105, y + 5.5);
      doc.text('Previsto', margin + 140, y + 5.5);
      doc.text('Status', margin + 160, y + 5.5);
      y += 8;
    }

    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, pageWidth - margin * 2, 7.5, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    doc.text(String(index + 1), margin + 2, y + 5);

    // Truncate descriptions if long
    const desc = it.descricao || 'Item do plano';
    const descShort = desc.length > 40 ? desc.substring(0, 38) + '...' : desc;
    doc.text(descShort, margin + 10, y + 5);

    const amb = it.ambiente || '-';
    doc.text(amb.length > 18 ? amb.substring(0, 16) + '..' : amb, margin + 74, y + 5);

    const ferr = it.ferramentas_necessarias || '-';
    doc.text(ferr.length > 20 ? ferr.substring(0, 18) + '..' : ferr, margin + 105, y + 5);

    const dataPrev = it.data_prevista ? it.data_prevista.split('T')[0] : '-';
    doc.text(dataPrev, margin + 140, y + 5);

    const isFeito = it.status === 'feito';
    if (isFeito) {
      doc.setTextColor(successColor[0], successColor[1], successColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('FEITO', margin + 160, y + 5);
    } else {
      doc.setTextColor(warningColor[0], warningColor[1], warningColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.text('NÃO FEITO', margin + 160, y + 5);
    }

    y += 7.5;
  });

  // 5. Signatures and Validation Section
  if (y > pageHeight - 45) {
    doc.addPage();
    y = margin + 10;
  } else {
    y = Math.max(y + 12, pageHeight - 45);
  }

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('Validação Soberana - Karol (Responsável pela Entrega)', margin, y + 8);
  doc.line(margin, y + 6, margin + 75, y + 6);

  doc.text('Consultoria Técnica & Auditoria (Santos)', pageWidth - margin - 75, y + 8);
  doc.line(pageWidth - margin - 75, y + 6, pageWidth - margin, y + 6);

  doc.setFontSize(7);
  doc.text('saasCONSTRUCT · Sistema de Adequação de Imóveis · PostgreSQL 16 · VPS Ready', margin, pageHeight - 6);
  doc.text('Critério de Sucesso do MVP 1: Relatório sem erros e validado', pageWidth - margin - 78, pageHeight - 6);

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
