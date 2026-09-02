export interface OutsideNativeProps {
  value: string;
}

export interface OutsideNativeComponent {
  readonly name: string;
  readonly props: OutsideNativeProps;
}

declare function codegenNativeComponent<T>(name: string): {
  readonly name: string;
  readonly props: T;
};

const OutsideView: OutsideNativeComponent =
  codegenNativeComponent<OutsideNativeProps>('OutsideView');

export default OutsideView;
