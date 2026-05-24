#!/usr/bin/env bash
# download-flags.sh
#
# Downloads all 197 country flag SVGs into the ./flags folder.
# Run once from the repo root. Re-running is safe (skips existing files).
#
# Source: github.com/lipis/flag-icons — MIT-licensed, well-maintained, 4:3 aspect ratio.
# SVGs are tiny (~1–4KB each), scale perfectly at any zoom, and total ~200KB for all 197.
#
# Usage:
#   bash download-flags.sh           # download SVGs (default)
#   bash download-flags.sh --png     # download PNGs from flagcdn.com instead

set -e

FORMAT="svg"
if [ "$1" = "--png" ]; then
  FORMAT="png"
fi

mkdir -p flags

# ISO-2 country codes for all 197 nations in the game.
CODES=(af al dz ad ao ag ar am au at az bs bh bd bb by be bz bj bt bo ba bw br bn
       bg bf bi cv kh cm ca cf td cl cn co km cd cg cr ci hr cu cy cz dk dj dm do
       ec eg sv gq er ee sz et fj fi fr ga gm ge de gh gr gd gt gn gw gy ht hn hu
       is in id ir iq ie il it jm jp jo kz ke ki xk kw kg la lv lb ls lr ly li lt
       lu mg mw my mv ml mt mh mr mu mx fm md mc mn me ma mz mm na nr np nl nz ni
       ne ng kp mk no om pk pw ps pa pg py pe ph pl pt qa ro ru rw kn lc vc ws sm
       st sa sn rs sc sl sg sk si sb so za kr ss es lk sd sr se ch sy tw tj tz th
       tl tg to tt tn tr tm tv ug ua ae gb us uy uz vu va ve vn ye zm zw)

echo "Downloading ${#CODES[@]} flags ($FORMAT) to ./flags/ ..."
count=0
skipped=0
failed=()
for code in "${CODES[@]}"; do
  out="flags/${code}.${FORMAT}"
  if [ -f "$out" ]; then
    skipped=$((skipped + 1))
    continue
  fi
  if [ "$FORMAT" = "svg" ]; then
    url="https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/${code}.svg"
  else
    url="https://flagcdn.com/w640/${code}.png"
  fi
  if curl -fsSL -o "$out" "$url"; then
    count=$((count + 1))
  else
    failed+=("$code")
    rm -f "$out"
  fi
done

echo ""
echo "Done. Downloaded: $count  Skipped (already present): $skipped  Failed: ${#failed[@]}"
if [ ${#failed[@]} -gt 0 ]; then
  echo "Failed codes: ${failed[*]}"
  echo "You can re-run the script to retry."
fi
echo ""
echo "Flag images are now in ./flags/  — commit the folder to your repo and you're done."
