import "./globals.css";

export const metadata = {
  title: "Initial vision",
  description: "Prototype deployed via VibeSharing",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://vibesharing.app/vs-sdk.js" defer></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
