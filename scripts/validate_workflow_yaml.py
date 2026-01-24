import os
import subprocess
import sys


def ensure_pyyaml():
    try:
        pass
    except Exception:
        print("PyYAML não encontrado — instalando via pip (usuário)...")
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "--user", "pyyaml"]
        )


def validate(path):
    try:
        import yaml

        with open(path, "r", encoding="utf-8") as f:
            yaml.safe_load(f)
        print(f"VALID: YAML parsed successfully: {path}")
        return 0
    except Exception as e:
        print(f"INVALID YAML: {e}")
        return 2


if __name__ == "__main__":
    target = (
        sys.argv[1]
        if len(sys.argv) > 1
        else os.path.join(os.getcwd(), ".github", "workflows", "db-ci.yml")
    )
    if not os.path.exists(target):
        print(f"File not found: {target}")
        sys.exit(1)
    try:
        ensure_pyyaml()
    except Exception as e:
        print(f"Failed to install PyYAML: {e}")
        sys.exit(1)
    sys.exit(validate(target))
