import React, { useRef, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Transaction, GymBranch } from '../../types';
import { TransactionReceipt } from './TransactionReceipt';
import { TransactionInvoice } from './TransactionInvoice';

export interface TransactionPrintProps {
  transaction: Transaction;
  branch?: GymBranch;
  format?: 'thermal_58' | 'thermal_80' | 'invoice_a4';
  isReprint?: boolean;
  reprintTimestamp?: string;
}

export const TransactionPrint: React.FC<TransactionPrintProps> = ({
  transaction,
  branch,
  format = 'thermal_80',
  isReprint = false,
  reprintTimestamp
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const pageStyle = useMemo(() => {
    if (format === 'thermal_58') {
      return `@media print {
        @page { size: 58mm auto !important; margin: 0mm !important; }
        body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
        .transaction-print {
          width: 58mm !important;
          max-width: 58mm !important;
          margin: 0 auto !important;
          padding: 2mm !important;
          box-shadow: none !important;
          border: none !important;
        }
      }`;
    }
    if (format === 'thermal_80') {
      return `@media print {
        @page { size: 80mm auto !important; margin: 0mm !important; }
        body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
        .transaction-print {
          width: 80mm !important;
          max-width: 80mm !important;
          margin: 0 auto !important;
          padding: 3mm !important;
          box-shadow: none !important;
          border: none !important;
        }
      }`;
    }
    return `@media print {
      @page { size: A4 portrait !important; margin: 10mm 15mm !important; }
      body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
      .transaction-print {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 auto !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
    }`;
  }, [format]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `RFA-GYM-${transaction.id}`,
    pageStyle
  });

  return (
    <div className="relative">
      <div ref={printRef}>
        {format === 'invoice_a4' ? (
          <TransactionInvoice
            transaction={transaction}
            branch={branch}
            isReprint={isReprint}
            reprintTimestamp={reprintTimestamp}
          />
        ) : (
          <TransactionReceipt
            transaction={transaction}
            branch={branch}
            paperWidth={format === 'thermal_58' ? '58mm' : '80mm'}
            isReprint={isReprint}
            reprintTimestamp={reprintTimestamp}
          />
        )}
      </div>
    </div>
  );
};
