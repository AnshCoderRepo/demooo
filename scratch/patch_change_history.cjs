const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/pages/ChangeHistory.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /const matchesType = typeFilter === 'all' \|\| h\.entityType === typeFilter;\s*return matchesSearch && matchesType;\s*\}\);/,
  `const matchesType = typeFilter === 'all' || h.entityType === typeFilter;
    const matchesAction = actionFilter === 'all' || h.action === actionFilter;
    return matchesSearch && matchesType && matchesAction;
  });`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched ChangeHistory.tsx!');

