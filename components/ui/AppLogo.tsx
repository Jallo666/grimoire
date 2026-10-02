type Props = {
  width?: number;
  fullWidth?: boolean;
};

export default function AppLogo({ width = 80, fullWidth = false }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo.png"
      alt="Logo"
      width={fullWidth ? undefined : width}
      style={{ display: "block", width: fullWidth ? "100%" : undefined, maxWidth: "100%", height: "auto" }}
    />
  );
}
