# dhanakanaka.in

Website for DhanaKanaka, the financial consultancy of C. Kanakaraju, Mysuru.
Plain HTML, CSS and JavaScript. No build step. Hosted on GitHub Pages.

## Pages

- `index.html`: hero, the three-card planner (investment, loans, DVG Balaga Prathishthana Consultancy), about, services, culture, gallery, contact
- `dvg-balaga.html`: DVG Balaga Prathishthana
- `samarasa.html`: Samarasa Ventures

## Language

English text lives in the HTML. Kannada lives in `js/i18n.js` (the `KN` block for page text, `DYN.kn` for text the calculators build). To change a line, find its `data-i18n` key in the HTML and edit both places.

## Gallery

```
python tools/build_gallery.py "J:\dhanakanaka.in\photos"
```

The script keeps only sharp photos of decent size, converts them to WebP in `assets/gallery/`, and writes `assets/gallery/gallery.json`. Add captions there (`caption` in English, `caption_kn` in Kannada). Photos it skips stay in your folder for later.

## Publish on GitHub Pages

```
git init
git add .
git commit -m "DhanaKanaka site"
git branch -M main
git remote add origin https://github.com/RSNK21/kanakaraju-site.git
git push -u origin main
```

Then in the repo: Settings > Pages > Deploy from branch > `main` / root. The `CNAME` file already says `dhanakanaka.in`.

At your domain registrar, point the domain to GitHub Pages:

- A records for `@`: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
- CNAME for `www`: `rsnk21.github.io`

Tick "Enforce HTTPS" in Pages settings once the certificate is issued.

## Notes

- The USD to INR rate is fetched quietly from open.er-api.com and cached for six hours. If that fails, the planner uses an approximate rate and says so.
- All WhatsApp buttons go to +91 94489 73582 with a prefilled message that carries the planner figures.
