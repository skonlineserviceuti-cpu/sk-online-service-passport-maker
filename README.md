# Passport Size Photo Maker

Simple browser-based tool for creating print-ready passport photos.

## How to use

1. Open [index.html](./index.html) in any modern browser (Chrome, Edge, Firefox).
2. Upload your image.
3. Pick preset size (`India`, `US`, or `Custom`) and DPI.
4. Adjust:
   - `Zoom` + drag image to align face
   - `Dress Code Style` (multiple presets + custom color)
   - `Dress Intensity` and `Dress Start Y (%)`
   - `Face Clean`
   - `Brightness / Contrast / Saturation / Sharpness`
   - `Background Color`
5. Set print layout:
   - `Top Margin (mm)` controls where sheet assembly starts from top
   - `Kitni Photo Chahiye` selects requested copy count
   - `Sheet Count` shows selected vs printable vs max fit (live update)
6. Click `Generate Print Sheet`.
7. Download:
   - `Download Passport PNG`
   - `Download Sheet PNG`
8. Use `Print Sheet` for direct printing.

## Notes

- For official use, always verify exact country guidelines before submission.
- Default quality is optimized for `300 DPI`.
