# Passport Size Photo Maker

Simple browser-based tool for creating print-ready passport photos.

## How to use

1. Open [index.html](./index.html) in any modern browser (Chrome, Edge, Firefox).
2. Upload your image.
3. Pick preset size (`India`, `US`, or `Custom`) and DPI.
4. Adjust:
   - `Zoom` + drag image to align face
   - `Face Clean`
   - `Brightness / Contrast / Saturation / Sharpness`
   - `Background Color`
   - `Remove BG Engine`
     - `Local` for plain backgrounds
     - `PhotoRoom API` for better cutout quality
5. If using PhotoRoom:
   - Select `PhotoRoom API` in `Remove BG Engine`
   - Paste your API key
   - Click `Run PhotoRoom Background Remove`
6. Set print layout:
   - `Top Margin (mm)` controls where sheet assembly starts from top
   - `Kitni Photo Chahiye` selects requested copy count
   - `Sheet Count` shows selected vs printable vs max fit
7. Click `Generate Print Sheet`.
8. Download:
   - `Download Passport PNG`
   - `Download Sheet PNG`
9. Use `Print Sheet` for direct printing.

## Notes

- Auto background removal works best on plain/studio background photos.
- PhotoRoom endpoint used: `https://sdk.photoroom.com/v1/segment` with `x-api-key`.
- For production use, keep API key on server-side proxy (avoid exposing key in public frontend).
- For official use, always verify exact country guidelines before submission.
- Default quality is optimized for `300 DPI`.
