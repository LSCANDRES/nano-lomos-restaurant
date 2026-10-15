#!/usr/bin/env python3
"""
Build and Push Docker images to Docker Hub via remote server.

Usage:
    python build.py                    # Auto-increment patch version
    python build.py --version 1.2.3    # Use specific version
    python build.py --major            # Increment major version
    python build.py --minor            # Increment minor version
    python build.py --no-push          # Build only, don't push
    python build.py --sync-only        # Only sync code, don't build
"""

import subprocess
import sys
import argparse
import json
import io
import os
from pathlib import Path
from datetime import datetime

# Fix Windows console encoding for emojis
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# =============================================
# CONFIGURACIÓN - Modificar estos valores
# =============================================
SERVER_HOST = "server-root"                    # SSH alias configurado en ~/.ssh/config
REMOTE_PATH = "/data/mi-app"                   # Path en el servidor
REMOTE_SRC = f"{REMOTE_PATH}/src"
DOCKERHUB_USER = "DOCKER_USER"                 # Tu usuario de DockerHub
IMAGE_BACKEND = f"{DOCKERHUB_USER}/mi-app-backend"
IMAGE_FRONTEND = f"{DOCKERHUB_USER}/mi-app-frontend"
DEPLOY_DIR = Path(__file__).parent             # docker/deploy/
DOCKER_DIR = DEPLOY_DIR.parent                 # docker/
PROJECT_ROOT = DOCKER_DIR.parent               # project root
VERSION_FILE = DEPLOY_DIR / "version.json"     # docker/deploy/version.json


def run_cmd(cmd, check: bool = True, capture: bool = False, shell: bool = False) -> subprocess.CompletedProcess:
    """Run a command locally and optionally capture output."""
    if shell:
        cmd_str = cmd if isinstance(cmd, str) else ' '.join(cmd)
        print(f">>> {cmd_str}")
        return subprocess.run(cmd_str, check=check, capture_output=capture, text=True, shell=True)
    print(f">>> {' '.join(cmd)}")
    return subprocess.run(cmd, check=check, capture_output=capture, text=True)


def run_ssh(cmd: str, check: bool = True) -> subprocess.CompletedProcess:
    """Run a command on the remote server via SSH."""
    full_cmd = ["ssh", SERVER_HOST, cmd]
    print(f">>> ssh {SERVER_HOST} \"{cmd}\"")
    result = subprocess.run(full_cmd, check=False, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr)
    if check and result.returncode != 0:
        raise subprocess.CalledProcessError(result.returncode, full_cmd, result.stdout, result.stderr)
    return result


def get_version() -> dict:
    """Get current version from version.json."""
    if VERSION_FILE.exists():
        with open(VERSION_FILE) as f:
            return json.load(f)
    return {"major": 0, "minor": 1, "patch": 0}


def save_version(version: dict):
    """Save version to version.json."""
    with open(VERSION_FILE, "w") as f:
        json.dump(version, f, indent=2)


def increment_version(version: dict, bump: str = "patch") -> dict:
    """Increment version number."""
    if bump == "major":
        version["major"] += 1
        version["minor"] = 0
        version["patch"] = 0
    elif bump == "minor":
        version["minor"] += 1
        version["patch"] = 0
    else:
        version["patch"] += 1
    return version


def version_string(version: dict) -> str:
    """Convert version dict to string."""
    return f"{version['major']}.{version['minor']}.{version['patch']}"


def sync_code():
    """Sync local code to remote server via rsync."""
    print("\n📤 Syncing code to server...")
    cmd = [
        "rsync", "-avz", "--delete",
        "--exclude", "node_modules",
        "--exclude", ".next",
        "--exclude", "dist",
        "--exclude", ".git",
        "--exclude", "docker/certificados",
        "--exclude", "docker/logs",
        f"{PROJECT_ROOT}/",
        f"{SERVER_HOST}:{REMOTE_SRC}/"
    ]
    run_cmd(cmd)
    print("✅ Code synced")


def build_images(version: str):
    """Build Docker images on the remote server."""
    ver = version

    print(f"\n🔨 Building backend image v{ver}...")
    run_ssh(
        f"cd {REMOTE_SRC} && docker build "
        f"-t {IMAGE_BACKEND}:{ver} "
        f"-t {IMAGE_BACKEND}:latest "
        f"-f docker/Dockerfile.backend ."
    )

    print(f"\n🔨 Building frontend image v{ver}...")
    run_ssh(
        f"cd {REMOTE_SRC} && docker build "
        f"--build-arg NEXT_PUBLIC_API_URL=https://MI_DOMINIO/api "
        f"-t {IMAGE_FRONTEND}:{ver} "
        f"-t {IMAGE_FRONTEND}:latest "
        f"-f docker/Dockerfile.frontend ."
    )


def push_images(version: str):
    """Push Docker images to DockerHub."""
    ver = version

    print("\n📤 Pushing images to DockerHub...")
    run_ssh(f"docker push {IMAGE_BACKEND}:{ver}")
    run_ssh(f"docker push {IMAGE_BACKEND}:latest")
    run_ssh(f"docker push {IMAGE_FRONTEND}:{ver}")
    run_ssh(f"docker push {IMAGE_FRONTEND}:latest")
    print("✅ Images pushed")


def main():
    parser = argparse.ArgumentParser(description="Build and push Docker images")
    parser.add_argument("--version", help="Specific version to use")
    parser.add_argument("--major", action="store_true", help="Increment major version")
    parser.add_argument("--minor", action="store_true", help="Increment minor version")
    parser.add_argument("--no-push", action="store_true", help="Build only, don't push")
    parser.add_argument("--sync-only", action="store_true", help="Only sync code")
    args = parser.parse_args()

    print("=" * 50)
    print("🏗️  MI_APP - Build & Push")
    print("=" * 50)

    # Sync code
    sync_code()

    if args.sync_only:
        print("\n✅ Sync complete (--sync-only)")
        return

    # Determine version
    if args.version:
        parts = args.version.split(".")
        ver = {"major": int(parts[0]), "minor": int(parts[1]), "patch": int(parts[2])}
    else:
        ver = get_version()
        bump = "major" if args.major else ("minor" if args.minor else "patch")
        ver = increment_version(ver, bump)

    ver_str = version_string(ver)
    print(f"\n📦 Version: {ver_str}")

    # Build
    build_images(ver_str)

    # Push
    if not args.no_push:
        push_images(ver_str)

    # Save version
    save_version(ver)
    print(f"\n✅ Build complete! Version: {ver_str}")


if __name__ == "__main__":
    main()
