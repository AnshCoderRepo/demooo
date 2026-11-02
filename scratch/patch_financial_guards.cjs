const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/context/AppContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Enhance deletePayment with automatic ledger balance reversal
const deletePaymentTarget = `  const deletePayment = (id: string) => {
    const p = data.payments.find((pay: PaymentRecord) => pay.id === id);
    setData((prev: any) => ({
      ...prev,
      payments: prev.payments.filter((pay: PaymentRecord) => pay.id !== id),
    }));
    if (p) {
      recordAudit('Payment', id, \`\${p.receiptNumber} (\${p.customerName})\`, 'Deleted', 'payment', \`₹\${p.amount}\`, 'Deleted', 'Payment transaction deleted');
    }
    showToast({ type: 'warning', title: 'Payment Record Deleted' });
  };`;

const deletePaymentReplacement = `  const deletePayment = (id: string) => {
    const p = data.payments.find((pay: PaymentRecord) => pay.id === id);
    setData((prev: any) => {
      let updatedCust = prev.customers;
      let updatedCharter = prev.charterBookings;
      if (p) {
        if (p.customerId) {
          updatedCust = prev.customers.map((c: Customer) => {
            if (c.id === p.customerId) {
              return {
                ...c,
                totalSpent: Math.max(0, c.totalSpent - p.amount),
                pendingBalance: c.pendingBalance + p.amount,
              };
            }
            return c;
          });
        }
        if (p.linkedType === 'charter' && p.linkedId) {
          updatedCharter = prev.charterBookings.map((b: CharterBooking) => {
            if (b.id === p.linkedId) {
              const newAdv = Math.max(0, b.advancePaid - p.amount);
              return {
                ...b,
                advancePaid: newAdv,
                balanceDue: Math.max(0, b.quote.grandTotal - newAdv),
              };
            }
            return b;
          });
        }
      }
      return {
        ...prev,
        payments: prev.payments.filter((pay: PaymentRecord) => pay.id !== id),
        customers: updatedCust,
        charterBookings: updatedCharter,
      };
    });
    if (p) {
      recordAudit('Payment', id, \`\${p.receiptNumber} (\${p.customerName})\`, 'Deleted', 'payment', \`₹\${p.amount}\`, 'Deleted', 'Payment transaction deleted and ledger balance restored');
    }
    showToast({ type: 'warning', title: 'Payment Record Deleted', message: 'Cashbook voucher deleted and party ledger balance restored.' });
  };`;

content = content.replace(deletePaymentTarget, deletePaymentReplacement);

// 2. Prevent duplicate salary payouts in payWorkerSalary
const paySalaryTarget = `  const payWorkerSalary = (workerId: string, month: string, amount: number, paymentMode: 'Bank' | 'Cash' | 'UPI') => {
    const worker = data.workers.find((w: Worker) => w.id === workerId);
    if (!worker) return;

    // 1. Auto create Expense under 'Salary'`;

const paySalaryReplacement = `  const payWorkerSalary = (workerId: string, month: string, amount: number, paymentMode: 'Bank' | 'Cash' | 'UPI') => {
    const worker = data.workers.find((w: Worker) => w.id === workerId);
    if (!worker) return;

    // Block duplicate salary payout
    const alreadyPaid = data.expenses.some(
      (e: Expense) => e.category === 'Salary' && e.notes.includes(worker.name) && e.notes.includes(month)
    );
    if (alreadyPaid) {
      showToast({
        type: 'warning',
        title: 'Salary Already Paid',
        message: \`Salary for \${worker.name} for \${month} has already been disbursed. Duplicate payout blocked.\`,
      });
      return;
    }

    // 1. Auto create Expense under 'Salary'`;

content = content.replace(paySalaryTarget, paySalaryReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully applied financial integrity guards in AppContext.tsx!');

