const { getConfig, Generator } = require('@tanstack/router-generator');

const config = getConfig({
  rootDir: process.cwd(),
  routesDir: 'src/routes',
  generatedRouteTree: 'src/routeTree.gen.ts',
  routeFileIgnorePattern: '(components|hooks|lib|integrations|types|\\.test|\\.spec)',
  quoteStyle: 'single',
  semicolons: false,
});

const generator = new Generator({ config });

generator.run();
