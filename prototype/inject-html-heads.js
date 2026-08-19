const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'client/pages');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (path.extname(f) === '.html') {
      callback(dirPath);
    }
  });
}

console.log('Injecting auth scripts and common.js references into HTML files...');

walkDir(pagesDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  const isLoginPage = filePath.includes('login');

  // Check if already injected
  if (content.includes('common.js')) {
    console.log(`Already injected: ${path.relative(__dirname, filePath)}`);
    return;
  }

  let injection = '';
  if (isLoginPage) {
    injection = `
    <!-- Authentication pre-load checks -->
    <script>
      if (localStorage.getItem('token')) {
        window.location.href = '/dashboard';
      }
    </script>
    <script src="/assets/js/common.js" defer></script>
    `;
  } else {
    injection = `
    <!-- Authentication pre-load checks -->
    <script>
      if (!localStorage.getItem('token')) {
        window.location.href = '/login';
      }
    </script>
    <script src="/assets/js/common.js" defer></script>
    `;
  }

  // Inject before </head>
  content = content.replace('</head>', `${injection}\n</head>`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Injected scripts into: ${path.relative(__dirname, filePath)}`);
});

console.log('Injection completed.');
