import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  'src/app/components/AddAppointmentScreen.tsx',
  'src/app/components/ui/tooltip.tsx',
  'src/app/components/ui/toggle.tsx',
  'src/app/components/ui/toggle-group.tsx',
  'src/app/components/ui/tabs.tsx',
  'src/app/components/ui/switch.tsx',
  'src/app/components/ui/sonner.tsx',
  'src/app/components/ui/slider.tsx',
  'src/app/components/ui/sidebar.tsx',
  'src/app/components/ui/sheet.tsx',
  'src/app/components/ui/separator.tsx',
  'src/app/components/ui/select.tsx',
  'src/app/components/ui/scroll-area.tsx',
  'src/app/components/ui/resizable.tsx',
  'src/app/components/ui/radio-group.tsx',
  'src/app/components/ui/progress.tsx',
  'src/app/components/ui/popover.tsx',
  'src/app/components/ui/pagination.tsx',
  'src/app/components/ui/navigation-menu.tsx',
  'src/app/components/ui/menubar.tsx',
  'src/app/components/ui/label.tsx',
  'src/app/components/ui/input-otp.tsx',
  'src/app/components/ui/hover-card.tsx',
  'src/app/components/ui/form.tsx',
  'src/app/components/ui/dropdown-menu.tsx',
  'src/app/components/ui/drawer.tsx',
  'src/app/components/ui/dialog.tsx',
  'src/app/components/ui/context-menu.tsx',
  'src/app/components/ui/command.tsx',
  'src/app/components/ui/collapsible.tsx',
  'src/app/components/ui/checkbox.tsx',
  'src/app/components/ui/chart.tsx',
  'src/app/components/ui/carousel.tsx',
  'src/app/components/ui/calendar.tsx',
  'src/app/components/ui/button.tsx',
  'src/app/components/ui/breadcrumb.tsx',
  'src/app/components/ui/badge.tsx',
  'src/app/components/ui/avatar.tsx',
  'src/app/components/ui/aspect-ratio.tsx',
  'src/app/components/ui/alert.tsx',
  'src/app/components/ui/alert-dialog.tsx',
  'src/app/components/ui/accordion.tsx',
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  // Replace from "package@version" with from "package"
  content = content.replace(/from "([^"]+)@[^"]+"/g, 'from "$1"');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${file}`);
});

console.log('All imports fixed!');
