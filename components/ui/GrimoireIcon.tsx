type Props = {
  name: string;
  size?: number;
};

export default function GrimoireIcon({ name, size = 16 }: Props) {
  return <i className={`bi bi-${name}`} style={{ fontSize: size }} />;
}
