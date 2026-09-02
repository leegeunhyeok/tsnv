export interface Spec {
  getValue(): string;
}

declare const TurboModuleRegistry: {
  getEnforcing<T>(name: string): T;
};

const NativeTestModule: Spec = TurboModuleRegistry.getEnforcing<Spec>('NativeTestModule');

export default NativeTestModule;
