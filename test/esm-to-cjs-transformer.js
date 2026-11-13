const ts = require('typescript');

/**
 * Jest transformer that converts ESM-only dependencies (puppeteer 25+) to CommonJS.
 *
 * ts-jest cannot be used for this: when two ts-jest transform entries exist it
 * applies one compiler configuration to both, and enabling `esModuleInterop`
 * globally breaks the app's own `import * as cuid from 'cuid'` call sites.
 */
module.exports = {
  process(sourceText, sourcePath) {
    const { outputText } = ts.transpileModule(sourceText, {
      fileName: sourcePath,
      compilerOptions: {
        allowJs: true,
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    });
    return { code: outputText };
  },
};
