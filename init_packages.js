const fs = require('fs');
const path = require('path');

const packages = ['database', 'events', 'types', 'auth', 'utils', 'api-client'];

packages.forEach(pkg => {
  const dir = path.join(__dirname, 'packages', pkg);
  const packageJson = {
    name: `@careconnect/${pkg}`,
    version: "1.0.0",
    private: true,
    main: "./src/index.ts",
    types: "./src/index.ts",
    dependencies: {},
    devDependencies: {
      "typescript": "^5.0.0",
      "@careconnect/config": "*"
    }
  };
  
  if (!fs.existsSync(path.join(dir, 'src'))) {
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  }
  
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(packageJson, null, 2));
  fs.writeFileSync(path.join(dir, 'src', 'index.ts'), '// Export API\nexport {};\n');
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), JSON.stringify({
    extends: "@careconnect/config/tsconfig.base.json",
    compilerOptions: { baseUrl: "." },
    include: ["src/**/*"]
  }, null, 2));
});
