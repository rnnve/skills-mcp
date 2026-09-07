export const metadata = {
  title: "Skills MCP",
  description: "Modular MCP host. First skill: Project SEKAI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          background: "#0b0d12",
          color: "#e8eaef",
        }}
      >
        {children}
      </body>
    </html>
  );
}
