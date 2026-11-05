import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';

// The repository suite uses jsdom 30. This separate package exercises the accepted consumer
// runtime through the published entry point, without changing either project's installation.
const requested = process.argv[2] ?? '4.2.0';
const library =
  isAbsolute(requested) || requested.startsWith('.')
    ? resolve(requested)
    : requested;
const directory = process.argv[3]
  ? resolve(process.argv[3])
  : mkdtempSync(join(tmpdir(), 'table-jsdom-'));
// A fresh directory prevents npm retaining a same-version local tarball for a registry run.
if (process.argv[3]) mkdirSync(directory);

const fixture = `// @vitest-environment jsdom
import { Stack, Table } from "@juwel-development/design-system";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, test } from "vitest";

const Example = () => {
\tconst [open, setOpen] = useState(false);
\tlet content = open ? (
\t\t<Table.Root caption="Population" notes="content">
\t\t\t<Table.Body>
\t\t\t\t<Table.Row>
\t\t\t\t\t<Table.HeaderCell scope="row">Population</Table.HeaderCell>
\t\t\t\t\t<Table.Cell>231</Table.Cell>
\t\t\t\t</Table.Row>
\t\t\t</Table.Body>
\t\t</Table.Root>
\t) : undefined;
\tfor (let depth = 0; depth < 20; depth++) content = <Stack>{content}</Stack>;
\treturn <><button type="button" onClick={() => setOpen(true)}>Open</button>{content}</>;
};

test("one public Table opens under nested public Stack components", async () => {
\trender(<Example />);

\tawait userEvent.click(screen.getByRole("button", { name: "Open" }));

\texpect(screen.getByRole("cell").textContent).toBe("231");
});

`;

writeFileSync(
  join(directory, 'package.json'),
  `${JSON.stringify(
    {
      name: 'table-jsdom-compatibility',
      private: true,
      type: 'module',
      dependencies: {
        '@juwel-development/design-system': library,
        react: '19.3.1',
        'react-dom': '19.3.1',
        rxjs: '7.8.2',
        vitest: '5.1.0',
        jsdom: '29.1.1',
        '@testing-library/react': '16.3.3',
        '@testing-library/user-event': '14.6.8',
        vite: '8.3.5',
        '@vitejs/plugin-react': '6.2.1',
      },
    },
    undefined,
    2,
  )}\n`,
);
writeFileSync(join(directory, 'Table420Reproduction.test.tsx'), fixture);
writeFileSync(
  join(directory, 'vitest.config.ts'),
  "import react from '@vitejs/plugin-react';\nimport { defineConfig } from 'vitest/config';\n\nexport default defineConfig({ plugins: [react()], test: { environment: 'jsdom', globals: true } });\n",
);
process.stdout.write(`Compatibility harness: ${directory}\n`);
execFileSync('npm', ['install'], { cwd: directory, stdio: 'inherit' });
execFileSync(
  'npm',
  [
    'exec',
    '--',
    'vitest',
    'run',
    'Table420Reproduction.test.tsx',
    '--reporter=verbose',
  ],
  { cwd: directory, stdio: 'inherit' },
);
