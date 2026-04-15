# Initial vision

## Project Structure

This is a **Next.js 14 App Router** project deployed via [VibeSharing](https://vibesharing.app).

- app/page.tsx — **Main page. This is what visitors see.** Edit this file.
- app/layout.tsx — Root layout (HTML head, global styles)
- app/globals.css — Global styles
- public/ — Static assets (images, fonts, standalone HTML)

## IMPORTANT: File Placement Rules

**NEVER put HTML files in the repo root.** Next.js does not serve files from the root directory. They will be invisible to visitors.

Where files go:
- React components → app/page.tsx or app/components/
- Static HTML files → public/ directory (served at /filename.html)
- Images/assets → public/ directory

If you have a standalone HTML prototype, either:
1. **Preferred:** Convert it to a React component in app/page.tsx
2. **Alternative:** Place it in public/prototype.html and update app/page.tsx to redirect:
   ```tsx
   import { redirect } from "next/navigation";
   export default function Page() { redirect("/prototype.html"); }
   ```

## Conventions

- Next.js 14 (App Router)
- Keep prototypes self-contained — inline mock data, no external APIs
- One page.tsx per prototype when possible

## Deployment

Push to main. Vercel auto-deploys within ~30-60 seconds. If you cannot push (e.g. in a sandboxed environment), stage and commit your changes so the user can push.

```bash
git add .
git commit -m "Describe what changed"
git push origin main
```

**Do NOT use vercel CLI, vercel deploy, zip upload, or any API endpoint. Just git push.**
