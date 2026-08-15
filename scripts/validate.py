#!/usr/bin/env python3
"""
AI Codex Repository & Drive Integrity Validator.
Validates codex.json manifest, all 15 domain editions, 10 command skills,
integrations, codex-drive/ artifacts, and README markdown link integrity.
"""

import json
import os
import re
import sys
from pathlib import Path

REQUIRED_EDITION_FILES = [
    "SKILL.md",
    "01-core-identity.md",
    "02-languages-standards.md",
    "03-first-principles.md",
    "04-domains-knowledge.md",
    "05-research-method.md",
    "06-response-style.md",
]

def validate_repository(root_dir: Path) -> bool:
    errors = []
    warnings = []

    print("=" * 60)
    print("AI Codex Repository & Drive Integrity Validator")
    print("=" * 60)

    # 1. Parse codex.json
    manifest_path = root_dir / "codex.json"
    if not manifest_path.is_file():
        errors.append("codex.json manifest file is missing from repository root.")
        return False

    try:
        codex = json.loads(manifest_path.read_text(encoding="utf-8"))
        print("[OK] codex.json: Valid JSON syntax")
    except Exception as e:
        errors.append(f"Failed to parse codex.json: {e}")
        return False

    # 2. Check codex-drive structure & artifacts
    drive_cfg = codex.get("drive", {})
    print(f"\n[INFO] Checking Codex Drive structure:")
    for key in ["brains", "plans", "specs", "walkthroughs"]:
        d_path = root_dir / drive_cfg.get(key, f"codex-drive/{key}")
        if not d_path.is_dir():
            errors.append(f"Missing codex-drive subfolder: {d_path}")
            print(f"  * codex-drive/{key}: [FAIL - MISSING]")
        else:
            print(f"  * codex-drive/{key}: [OK]")

    # Check archive subfolders
    for arch in ["plans/archive", "specs/archive"]:
        arch_path = root_dir / f"codex-drive/{arch}"
        if not arch_path.is_dir():
            errors.append(f"Missing archive subfolder: {arch_path}")
            print(f"  * codex-drive/{arch}: [FAIL - MISSING]")
        else:
            print(f"  * codex-drive/{arch}: [OK]")

    # Audit active codex-drive markdown artifacts
    drive_dir = root_dir / "codex-drive"
    if drive_dir.exists():
        artifact_count = 0
        for root, _, files in os.walk(drive_dir):
            for f in files:
                if f.endswith(".md") and not f.startswith("."):
                    artifact_count += 1
                    file_path = Path(root) / f
                    rel_path = file_path.relative_to(root_dir).as_posix()
                    content = file_path.read_text(encoding="utf-8")

                    # Verify creation metadata
                    if "Created At" not in content and "Date" not in content:
                        warnings.append(f"[{rel_path}] Missing creation timestamp metadata header (`Created At`).")

                    # Verify status metadata in plans and specs
                    if ("plans" in rel_path or "specs" in rel_path) and "Status" not in content:
                        warnings.append(f"[{rel_path}] Missing status metadata header (`Status: DRAFT|IN_PROGRESS|COMPLETED`).")

        print(f"  * codex-drive artifacts: [OK] ({artifact_count} active files verified)")

    # 3. Check each edition in codex.json
    editions = codex.get("editions", [])
    print(f"\n[INFO] Discovered {len(editions)} domain editions in manifest:")
    for ed in editions:
        ed_id = ed.get("id")
        ed_dir_name = ed.get("directory")
        ed_name = ed.get("name")
        ed_path = root_dir / ed_dir_name

        clean_name = ed_name.replace("—", "-").replace("–", "-")
        print(f"  * Checking [{ed_id}] ({clean_name})...", end=" ")

        if not ed_path.is_dir():
            errors.append(f"Edition directory not found on disk: {ed_dir_name}")
            print("[FAIL - DIRECTORY MISSING]")
            continue

        # Check required files
        missing_files = []
        for req in REQUIRED_EDITION_FILES:
            file_path = ed_path / req
            if not file_path.is_file():
                missing_files.append(req)
            elif file_path.stat().st_size == 0:
                errors.append(f"Empty file in {ed_dir_name}: {req}")

        if missing_files:
            errors.append(f"Edition '{ed_id}' is missing required files: {missing_files}")
            print(f"[FAIL - MISSING {len(missing_files)} FILES]")
        else:
            print(f"[OK] ({len(REQUIRED_EDITION_FILES)}/{len(REQUIRED_EDITION_FILES)} files)")

    # 4. Verify Command Skills in codex.json
    commands = codex.get("commands", [])
    print(f"\n[INFO] Checking {len(commands)} command skills:")
    for cmd in commands:
        cmd_id = cmd.get("command")
        cmd_dir = cmd.get("directory")
        cmd_path = root_dir / cmd_dir

        if (cmd_path / "SKILL.md").is_file():
            skill_content = (cmd_path / "SKILL.md").read_text(encoding="utf-8")
            if not skill_content.startswith("---") or "name:" not in skill_content:
                errors.append(f"Invalid frontmatter in {cmd_dir}/SKILL.md")
                print(f"  * {cmd_id}: [FAIL - INVALID FRONTMATTER]")
            else:
                print(f"  * {cmd_id}: [OK] (SKILL.md ready)")
        else:
            print(f"  * {cmd_id}: [PENDING DESIGN] ({cmd_dir})")

    # 5. Verify Integrations in codex.json
    integrations = codex.get("integrations", {})
    print(f"\n[INFO] Checking {len(integrations)} integrations:")
    for int_name, int_data in integrations.items():
        cfg_path = root_dir / int_data.get("config", "")
        if not cfg_path.exists():
            errors.append(f"Integration config template not found: {cfg_path}")
            print(f"  * {int_name}: [FAIL] Template missing ({cfg_path})")
        else:
            print(f"  * {int_name}: [OK] Config template present ({int_data.get('config')})")

    # 6. Verify README.md references and tables
    readme_path = root_dir / "README.md"
    if not readme_path.exists():
        errors.append("README.md not found in root")
    else:
        readme_content = readme_path.read_text(encoding="utf-8")
        links = re.findall(r"\[.*?\]\((.*?)\)", readme_content)
        for link in links:
            if link.startswith("#") or link.startswith("http") or link.startswith("mailto") or link.startswith("../"):
                continue
            target_path = root_dir / link
            if not target_path.exists():
                errors.append(f"Broken link in README.md: '{link}' -> {target_path}")

    # Summary
    print("\n" + "=" * 60)
    if warnings:
        print(f"[WARNING] {len(warnings)} non-blocking advisory note(s):")
        for w in warnings:
            print(f"  * {w}")
        print("-" * 60)

    if errors:
        print(f"[FAIL] VALIDATION FAILED: {len(errors)} error(s) found:")
        for err in errors:
            print(f"  - {err}")
        return False
    else:
        print(f"[PASS] ALL CHECKS PASSED: Repository and drive verified with complete integrity!")
        print("=" * 60)
        return True


if __name__ == "__main__":
    repo_root = Path(__file__).resolve().parent.parent
    success = validate_repository(repo_root)
    sys.exit(0 if success else 1)
