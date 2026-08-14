export interface NativeProps {
  value: string;
}

export interface NativeComponent<T> {
  readonly name: string;
  readonly props: T;
}

declare function codegenNativeComponent<T>(name: string): NativeComponent<T>;

const TestView: NativeComponent<NativeProps> = codegenNativeComponent<NativeProps>('TestView');

export default TestView;
