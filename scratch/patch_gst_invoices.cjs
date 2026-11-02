const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/pages/GstInvoices.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /const matchesType = typeFilter === 'all' \|\| inv\.type === typeFilter;\s*return matchesSearch && matchesType;\s*\}\);/,
  `const matchesType = typeFilter === 'all' || inv.type === typeFilter;
    const matchesDate = isDateInFilter(inv.date, dateFilter, customStart, customEnd);
    const matchesTaxSupply = 
      taxSupplyFilter === 'all' ? true :
      taxSupplyFilter === 'intra' ? !inv.isInterState :
      inv.isInterState;
    return matchesSearch && matchesType && matchesDate && matchesTaxSupply;
  });`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched GstInvoices.tsx!');

