type Props = {
  width?: number;
  className?: string;
};

export default function AppLogo({ width = 80, className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo.png"
      alt="Logo"
      width={width}
      className={className}
      style={{ display: "block", maxWidth: "100%", height: "auto" }}
    />
  );
}
