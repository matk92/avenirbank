const path = require('path');
const fs = require('fs');
const ts = require('typescript');

module.exports = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('CompileMigrationsPlugin', (compilation) => {
          const srcDir = path.join(__dirname, 'src/infrastructure/database/migrations');
          const distDir = path.join(__dirname, 'dist/infrastructure/database/migrations');

          if (fs.existsSync(srcDir)) {
            if (!fs.existsSync(distDir)) {
              fs.mkdirSync(distDir, { recursive: true });
            }
            fs.readdirSync(srcDir).forEach((file) => {
              if (file.endsWith('.ts')) {
                const srcFile = path.join(srcDir, file);
                const jsFile = file.replace('.ts', '.js');
                const distFile = path.join(distDir, jsFile);
                
                const sourceCode = fs.readFileSync(srcFile, 'utf-8');
                const result = ts.transpileModule(sourceCode, {
                  compilerOptions: { module: ts.ModuleKind.CommonJS }
                });
                
                fs.writeFileSync(distFile, result.outputText);
              }
            });
          }
        });
      },
    },
  ],
};
