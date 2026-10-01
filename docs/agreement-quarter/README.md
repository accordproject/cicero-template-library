# The Agreement Quarter

A walkthrough page for the Agreement 1.0 template proposal prototyped in
`src/copyright-license-agreement-poc` (PR #528): what changes for template
authors, what they get, and the code behind each change. Open `index.html`
in a browser.

## Plates

The twelve illustrations in `images/` were generated from `scenes.json`
(one shared style, one prompt per scene) with Google's Gemini 2.5 Flash
Image model ("Nano Banana") through `nano-banana-mcp` 1.0.3, at a 16:9
aspect ratio, then saved as WebP. That release asks for the retired
`gemini-2.5-flash-image-preview` model and sets no aspect ratio, so it was
run with both patched. A plate whose image is missing shows a numbered
placeholder.
