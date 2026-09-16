/// <reference types="nativewind/types" />

// TypeScript 6 treats CSS side-effect imports as unchecked module resolution
// (TS2882) unless an ambient declaration exists.
declare module '*.css';
