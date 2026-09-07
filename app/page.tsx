import { skills } from "@/lib/registry";

export default function Page() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
      <p style={{ letterSpacing: "0.14em", color: "#9aa3b5", fontSize: 12 }}>
        MCP HOST
      </p>
      <h1 style={{ fontSize: 40, margin: "8px 0 12px" }}>Skills MCP</h1>
      <p style={{ color: "#b7becc", lineHeight: 1.6, maxWidth: 620 }}>
        A normal skill host over Model Context Protocol. Drop a folder in{" "}
        <code>skills/</code>, register it, ship. First skill is Project SEKAI
        (sekai.best master data).
      </p>

      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 16, color: "#9aa3b5" }}>Connect</h2>
        <pre
          style={{
            background: "#151821",
            border: "1px solid #2a3142",
            borderRadius: 10,
            padding: 16,
            overflow: "auto",
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >{`{
  "mcpServers": {
    "skills": {
      "url": "https://YOUR-DEPLOYMENT.vercel.app/api/mcp"
    }
  }
}`}</pre>
        <p style={{ color: "#8b93a7", fontSize: 13 }}>
          Streamable HTTP. Same path also lives at <code>/mcp</code>.
        </p>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 16, color: "#9aa3b5" }}>Skills</h2>
        {skills.map((s) => (
          <article
            key={s.id}
            style={{
              marginTop: 12,
              padding: 16,
              border: "1px solid #2a3142",
              borderRadius: 12,
              background: "#12151d",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <strong>{s.title}</strong>
              <span style={{ color: "#8b93a7", fontSize: 12 }}>{s.id} · v{s.version}</span>
            </div>
            <p style={{ color: "#b7becc", margin: "8px 0 10px" }}>{s.description}</p>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#d0d5e0", fontSize: 14 }}>
              {s.tools.map((t) => (
                <li key={t.name}>
                  <code>{t.name}</code> — {t.description}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 16, color: "#9aa3b5" }}>Add another skill</h2>
        <ol style={{ color: "#c5cad6", lineHeight: 1.7 }}>
          <li>
            Copy <code>skills/_template</code> to <code>skills/your-id</code>
          </li>
          <li>
            Export a <code>Skill</code> with tools + handlers
          </li>
          <li>
            Import it in <code>lib/registry.ts</code> and append to{" "}
            <code>skills</code>
          </li>
          <li>Push. Vercel redeploys.</li>
        </ol>
      </section>
    </main>
  );
}
