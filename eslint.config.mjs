import { config } from '@n8n/node-cli/eslint';

// Agent worktrees live in .claude/ inside the repository folder.
export default [...config, { ignores: ['.claude/**'] }];
