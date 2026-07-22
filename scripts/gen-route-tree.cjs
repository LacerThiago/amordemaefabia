const { Generator } = require('@tanstack/router-generator');

const generator = new Generator({
  rootDir: process.cwd(),
  routesDir: 'src/routes',
  generatedRouteTree: 'src/routeTree.gen.ts',
  routeFileIgnorePattern: '(components|hooks|lib|integrations|types|\.test|\.spec)',
  quoteStyle: 'single',
  semicolons: false,
});

generator.generate();
