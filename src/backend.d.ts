declare module "@/backend.js" {
  export const Module: {
    blocks(): string;
    onRuntimeInitialized?: () => void;
  };
}
