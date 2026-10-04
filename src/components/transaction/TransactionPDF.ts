import React from 'react';
import { createRoot } from 'react-dom/client';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { Transaction, GymBranch } from '../../types';
import { TransactionInvoice } from './TransactionInvoice';
import { TransactionReceipt } from './TransactionReceipt';

export interface GeneratePDFOptions {
  paperFormat?: 'a4' | '58mm' | '80mm';
  fileName?: string;
  onStart?: () => void;
  onSuccess?: (fileName: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Utility to generate and download a clean PDF from a DOM element or Transaction
 */
export async function downloadTransactionPDFFromElement(
  element: HTMLElement,
  transaction: Transaction,
  options: GeneratePDFOptions = {}
): Promise<string> {
  const {
    paperFormat = 'a4',
    fileName,
    onStart,
    onSuccess,
    onError
  } = options;

  if (onStart) onStart();

  try {
    // Generate high resolution canvas
    const canvas = await html2canvas(element, {
      scale: 2, // High DPI for crisp text
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Standardized file name format: RFA-GYM-TRX-YYYYMMDD-XXXX.pdf
    const cleanId = transaction.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const finalFileName = fileName || `RFA-GYM-${cleanId}.pdf`;

    if (paperFormat === '58mm') {
      const pdfWidth = 58;
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, Math.max(pdfHeight, 60)]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(finalFileName);
    } else if (paperFormat === '80mm') {
      const pdfWidth = 80;
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, Math.max(pdfHeight, 80)]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(finalFileName);
    } else {
      // Standard A4 portrait
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));
      pdf.save(finalFileName);
    }

    if (onSuccess) onSuccess(finalFileName);
    return finalFileName;
  } catch (err: any) {
    console.error('Error generating transaction PDF:', err);
    if (onError) onError(err instanceof Error ? err : new Error(String(err)));
    throw err;
  }
}

/**
 * High-level helper: render off-screen container, capture to PDF, and trigger download
 */
export async function generateAndDownloadTransactionPDF(
  transaction: Transaction,
  branch?: GymBranch,
  options: GeneratePDFOptions = {}
): Promise<string> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = options.paperFormat === '58mm' ? '58mm' : options.paperFormat === '80mm' ? '80mm' : '210mm';
  container.style.background = '#ffffff';
  container.style.zIndex = '-100';
  document.body.appendChild(container);

  const root = createRoot(container);

  return new Promise((resolve, reject) => {
    try {
      root.render(
        options.paperFormat === '58mm' || options.paperFormat === '80mm'
          ? React.createElement(TransactionReceipt, {
              transaction,
              branch,
              paperWidth: options.paperFormat === '58mm' ? '58mm' : '80mm'
            })
          : React.createElement(TransactionInvoice, {
              transaction,
              branch
            })
      );

      // Give browser time to finish font and layout render
      setTimeout(async () => {
        try {
          const fileName = await downloadTransactionPDFFromElement(container, transaction, options);
          resolve(fileName);
        } catch (err) {
          reject(err);
        } finally {
          setTimeout(() => {
            root.unmount();
            if (container.parentNode) {
              container.parentNode.removeChild(container);
            }
          }, 100);
        }
      }, 300);
    } catch (err) {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
      reject(err);
    }
  });
}
