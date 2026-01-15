import { defineConfig } from 'tsup';

export default defineConfig([
    // ESM build
    {
        entry: ['src/index.ts'],
        format: ['esm'],
        dts: true,
        sourcemap: true,
        clean: true,
        outDir: 'dist/esm',
        target: 'es2022',
        platform: 'neutral',
        splitting: false,
        treeshake: true,
        minify: false,
        esbuildOptions(options) {
            options.conditions = ['module'];
        },
    },
    // CJS build
    {
        entry: ['src/index.ts'],
        format: ['cjs'],
        dts: false,
        sourcemap: true,
        outDir: 'dist/cjs',
        target: 'es2022',
        platform: 'node',
        splitting: false,
        treeshake: true,
        minify: false,
    },
]);
