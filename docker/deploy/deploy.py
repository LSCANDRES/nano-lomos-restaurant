#!/usr/bin/env python3
"""
Deploy MI_APP to production server.

Pulls images from DockerHub and recreates containers.

Usage:
    python deploy.py                    # Deploy latest version from version.json
    python deploy.py --version 1.2.3    # Deploy specific version
    python deploy.py --restart          # Just restart containers
    python deploy.py --status           # Show container status
    python deploy.py --logs             # Show container logs
"""

import subprocess
import sys
import argparse
import json
import io
from pathlib import Path

# Fix Windows console encoding for emojis
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# =============================================
# CONFIGURACIÓN - Modificar estos valores
# =============================================
SERVER_HOST = "server-root"                    # SSH alias configurado en ~/.ssh/config
DEPLOY_PATH = "/data/mi-app/src/docker"        # Path al docker-compose en el servidor
DOCKERHUB_USER = "DOCKER_USER"                 # Tu usuario de DockerHub
IMAGE_BACKEND = f"{DOCKERHUB_USER}/mi-app-backend"
IMAGE_FRONTEND = f"{DOCKERHUB_USER}/mi-app-frontend"
VERSION_FILE = Path(__file__).parent / "version.json"


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


def get_version() -> str:
    """Get current version from version.json."""
    if VERSION_FILE.exists():
        with open(VERSION_FILE) as f:
            v = json.load(f)
            return f"{v['major']}.{v['minor']}.{v['patch']}"
    return "latest"


def pull_images(version: str):
    """Pull Docker images on the server."""
    print("\n📥 Pulling images on server...")
    run_ssh(f"docker pull {IMAGE_BACKEND}:{version}")
    run_ssh(f"docker pull {IMAGE_FRONTEND}:{version}")


def update_compose_file(version: str):
    """Update docker-compose.prod.yml with new version tags."""
    print("\n📝 Updating docker-compose.prod.yml...")
    run_ssh(f"sed -i 's|{IMAGE_BACKEND}:.*|{IMAGE_BACKEND}:{version}|g' {DEPLOY_PATH}/docker-compose.prod.yml")
    run_ssh(f"sed -i 's|{IMAGE_FRONTEND}:.*|{IMAGE_FRONTEND}:{version}|g' {DEPLOY_PATH}/docker-compose.prod.yml")


def recreate_containers(skip_pull: bool = False):
    """Recreate containers with new images."""
    print("\n🔄 Stopping old containers...")
    run_ssh(f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml down", check=False)

    print("\n🚀 Starting new containers...")
    run_ssh(f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml up -d")


def show_status():
    """Show container status."""
    print("\n📊 Container Status:")
    run_ssh(f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml ps")


def show_logs():
    """Show recent container logs."""
    print("\n📋 Backend logs:")
    run_ssh(f"docker logs mi-app-backend --tail 20", check=False)
    print("\n📋 Frontend logs:")
    run_ssh(f"docker logs mi-app-frontend --tail 20", check=False)


def deploy(version: str):
    """Full deploy: pull, update compose, recreate."""
    print(f"\n🚀 Deploying version {version}...")

    pull_images(version)
    update_compose_file(version)
    recreate_containers()
    show_status()

    print(f"\n✅ Deploy complete! Version: {version}")
    print(f"🌐 URL: https://MI_DOMINIO")


def main():
    parser = argparse.ArgumentParser(description="Deploy MI_APP to production")
    parser.add_argument("--version", help="Specific version to deploy")
    parser.add_argument("--restart", action="store_true", help="Just restart containers")
    parser.add_argument("--status", action="store_true", help="Show container status")
    parser.add_argument("--logs", action="store_true", help="Show container logs")
    args = parser.parse_args()

    print("=" * 50)
    print("🚀 MI_APP - Deploy to Production")
    print("=" * 50)

    if args.status:
        show_status()
        return

    if args.logs:
        show_logs()
        return

    if args.restart:
        recreate_containers(skip_pull=True)
        show_status()
        return

    version = args.version or get_version()
    deploy(version)


if __name__ == "__main__":
    main()
