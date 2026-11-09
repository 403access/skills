#!/usr/bin/env bash
# Install the prompt-archaeology skills into an OpenCode skills directory.
#   ./scripts/install-skills.sh             → ~/.config/opencode/skills (global)
#   ./scripts/install-skills.sh --project    → ./.opencode/skills
set -euo pipefail

repo="$(cd "$(dirname "$0")/.." && pwd)"
dest="$HOME/.config/opencode/skills"
if [[ "${1:-}" == "--project" ]]; then
  dest="$(pwd)/.opencode/skills"
fi

mkdir -p "$dest"
count=0
for dir in "$repo"/skills/*/; do
  [[ -f "$dir/SKILL.md" ]] || continue
  name="$(basename "$dir")"
  rm -rf "$dest/$name"
  cp -R "$dir" "$dest/$name"
  count=$((count + 1))
  printf '  installed %s\n' "$name"
done

printf '\n%d skills → %s\n' "$count" "$dest"
printf 'Reload OpenCode with /reload if it is running.\n'
