import { jsPDF } from 'jspdf';

/**
 * Adds a Cameroonian professional header to a jsPDF document.
 * This header follows the layout specified in the template_entete.docx
 */
export const addProfessionalHeader = (doc: any, settings: any, title: string) => {
  const centerX = 105;
  const leftX = 52.5;
  const rightX = 157.5;
  const topY = 10;

  // Set font
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(33, 33, 33);

  // Left Column (French)
  doc.text('RÉPUBLIQUE DU CAMEROUN', leftX, topY, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('times', 'normal');
  doc.text('Paix - Travail - Patrie', leftX, topY + 4, { align: 'center' });
  doc.text('* * * * * * *', leftX, topY + 7, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text((settings.establishment_name || settings.name || '').toUpperCase(), leftX, topY + 11, { align: 'center' });
  doc.setFontSize(7);
  doc.text((settings.slogan || '').toUpperCase(), leftX, topY + 15, { align: 'center' });
  doc.text('* * * * * * *', leftX, topY + 18, { align: 'center' });
  
  // ARTICLE (New Field)
  doc.setFontSize(6.5);
  doc.setFont('times', 'normal');
  const articleLines = doc.splitTextToSize(settings.article_text || '', 60);
  doc.text(articleLines, leftX, topY + 22, { align: 'center' });
  
  const bottomHeaderY = topY + 22 + (articleLines.length * 3);
  doc.text(`Tél : ${settings.phone || ''}`, leftX, bottomHeaderY + 2, { align: 'center' });
  doc.text(`B.P. ${settings.postal_code || ''} ${settings.city || ''} (${settings.country || 'Cameroun'})`, leftX, bottomHeaderY + 5, { align: 'center' });
  doc.text(`Email : ${settings.email || ''}`, leftX, bottomHeaderY + 8, { align: 'center' });

  // Right Column (English)
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.text('REPUBLIC OF CAMEROON', rightX, topY, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('times', 'normal');
  doc.text('Peace - Work - Fatherland', rightX, topY + 4, { align: 'center' });
  doc.text('* * * * * * *', rightX, topY + 7, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text((settings.english_name || settings.establishment_name || settings.name || '').toUpperCase(), rightX, topY + 11, { align: 'center' });
  doc.setFontSize(7);
  doc.text((settings.slogan || '').toUpperCase(), rightX, topY + 15, { align: 'center' });
  doc.text('* * * * * * *', rightX, topY + 18, { align: 'center' });

  // ARTICLE (Right)
  doc.setFontSize(6.5);
  doc.setFont('times', 'normal');
  doc.text(articleLines, rightX, topY + 22, { align: 'center' });

  doc.text(`Phone : ${settings.phone || ''}`, rightX, bottomHeaderY + 2, { align: 'center' });
  doc.text(`PO.BOX ${settings.postal_code || ''} ${settings.city || ''} (${settings.country || 'Cameroon'})`, rightX, bottomHeaderY + 5, { align: 'center' });
  doc.text(`Email : ${settings.email || ''}`, rightX, bottomHeaderY + 8, { align: 'center' });

  // Center Logo
  try {
    const logoSrc = settings.logo || '/logo.png';
    const logoUrl = (logoSrc.startsWith('http') || logoSrc.startsWith('data:')) 
      ? logoSrc 
      : `${window.location.origin}${logoSrc}`;
    
    doc.addImage(logoUrl, 'PNG', centerX - 12.5, topY + 2, 25, 20);
  } catch (e) { 
    console.error('PDF Logo Error:', e);
  }
  
  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(15, bottomHeaderY + 15, 195, bottomHeaderY + 15);

  // Main Title
  doc.setFontSize(16);
  doc.setFont('times', 'bold');
  const titleY = bottomHeaderY + 25;
  doc.text(title.toUpperCase(), centerX, titleY, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(centerX - 35, titleY + 2, centerX + 35, titleY + 2);
  
  // Date of export
  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  doc.text(`Fait à ${settings.city || 'Yaoundé'}, le ${new Date().toLocaleDateString('fr-FR')}`, 14, titleY + 10);
  
  return titleY + 15; // Return startY for autoTable
};
