# The Agreement Quarter

A walkthrough page for the Agreement 1.0 template proposal, as implemented
in accordproject/models#205, template-engine#187 and template-archive#946
and #950, and shown by `src/copyright-license-agreement-poc` and its sibling
templates `src/late-payment-poc` and `src/licensed-work-schedule-poc`
(PR #528): what changes for template authors, what they get, and the code
behind each change. Open `index.html` in a browser.

## Plates

The twelve illustrations in `images/` were generated from `scenes.json`
(one shared style, one prompt per scene) with Google's Gemini 2.5 Flash
Image model ("Nano Banana") through `nano-banana-mcp` 1.0.3, at a 16:9
aspect ratio, then saved as WebP. That release asks for the retired
`gemini-2.5-flash-image-preview` model and sets no aspect ratio, so it was
run with both patched. A plate whose image is missing shows a numbered
placeholder.

The people were then redrawn for a diverse cast, keeping each plate's
style and composition: the recurring barrister is a Black woman, and the
other figures are of mixed origins (the `cast` and per-scene `people` in
`scenes.json`). These are edits of the original plates, not new
generations. Two of them, the registrar and the porters, needed Gemini 3
Pro Image ("Nano Banana Pro"), which the earlier model refused to change.
The barrister wears a wig only in the Moot, the one scene in court
dress.
