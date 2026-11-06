import {
  BatteryCharging,
  Cable,
  Camera,
  Cpu,
  Gamepad2,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  Monitor,
  Mouse,
  PackageSearch,
  Printer,
  Router,
  Smartphone,
  Tablet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const categoryIcons: [string[], LucideIcon][] = [
  [["ordinateur", "laptop", "notebook", "pc"], Laptop],
  [["ecran", "écran", "monitor", "moniteur"], Monitor],
  [["composant", "processeur", "cpu", "carte"], Cpu],
  [["casque", "audio", "son", "headphone"], Headphones],
  [["clavier", "keyboard"], Keyboard],
  [["souris", "mouse"], Mouse],
  [["reseau", "réseau", "router", "routeur", "wifi"], Router],
  [["stockage", "disque", "ssd", "hard"], HardDrive],
  [["imprimante", "printer"], Printer],
  [["telephone", "téléphone", "smartphone", "mobile"], Smartphone],
  [["tablette", "tablet"], Tablet],
  [["gaming", "jeu", "gaming", "console"], Gamepad2],
  [["photo", "camera", "caméra"], Camera],
  [["batterie", "chargeur", "alimentation"], BatteryCharging],
  [["cable", "câble", "adaptateur"], Cable],
];

type CategoryIconProps = {
  name: string;
  slug?: string;
  icon?: string | null;
  className?: string;
};

export default function CategoryIcon({ name, slug = "", icon, className }: CategoryIconProps) {
  const category = `${name} ${slug} ${icon ?? ""}`.toLocaleLowerCase("fr");
  const Icon = categoryIcons.find(([terms]) => terms.some((term) => category.includes(term)))?.[1] ?? PackageSearch;

  return <Icon aria-hidden="true" className={cn("h-5 w-5", className)} strokeWidth={1.7} />;
}
