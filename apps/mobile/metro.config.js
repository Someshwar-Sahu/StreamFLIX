const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../../');

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    extraNodeModules: {
      '@streamflix/types': path.resolve(workspaceRoot, 'packages/types/src/index.ts'),
      '@streamflix/ui': path.resolve(workspaceRoot, 'packages/ui/src/index.ts'),
      '@streamflix/api-client': path.resolve(workspaceRoot, 'packages/api-client/src/index.ts'),
      '@babel/runtime': path.resolve(workspaceRoot, 'node_modules/@babel/runtime'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
