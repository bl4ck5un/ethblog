from fabric import task
import zipfile
import hashlib
import base64
import io
from pathlib import Path


@task
def compress_md(c, path):
    """
    Compress a Markdown file into a zip-base64-sha256 format.
    Produces:
      - <file>.zlb: multiline header + base64 zip
      - <file>.inline.txt: single-line escaped string
    """
    file_path = Path(path)
    if not file_path.exists():
        print(f"❌ File not found: {path}")
        return

    original = file_path.read_bytes()
    sha256 = hashlib.sha256(original).hexdigest()

    # Create ZIP in memory
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("content.md", original)

    encoded_body = base64.b64encode(buffer.getvalue()).decode("utf-8")

    lines = [
        "---",
        "version: 0",
        "algorithm: zip-base64-sha256",
        f"original-length: {len(original)}",
        f"sha256: {sha256}",
        "---",
        encoded_body
    ]

    multiline = "\n".join(lines)
    single_line = multiline.replace("\\", "\\\\").replace(
        "\n", "\\n").replace('"', '\\"')

    base = file_path.stem
    multiline_path = Path(f"{base}.zlb")
    inline_path = Path(f"{base}.inline.txt")

    multiline_path.write_text(multiline, encoding="utf-8")
    inline_path.write_text(single_line, encoding="utf-8")

    print(f"✅ Multiline output written to: {multiline_path}")
    print(f"✅ Inline (escaped) string written to: {inline_path}")


@task
def decompress_md(c, path):
    """
    Decompress a zip-base64-sha256 string (single-line, e.g. from inline.txt).
    Prints decompressed Markdown to stdout only.
    """
    file_path = Path(path)
    if not file_path.exists():
        print(f"❌ File not found: {path}")
        return

    try:
        raw = file_path.read_text(encoding="utf-8").strip()
        text = raw.replace("\\n", "\n")  # unescape
    except Exception as e:
        print(f"❌ Failed to read or parse file: {e}")
        return

    lines = text.splitlines()
    if not (lines and lines[0].strip() == "---"):
        print("❌ Invalid format: missing opening '---'")
        return

    try:
        second_dash_index = lines.index("---", 1)
    except ValueError:
        print("❌ Invalid format: missing second '---'")
        return

    header_lines = lines[1:second_dash_index]
    b64_body = "\n".join(lines[second_dash_index + 1:])
    headers = {}
    for line in header_lines:
        if ": " in line:
            k, v = line.split(": ", 1)
            headers[k.strip()] = v.strip()

    if headers.get("version") != "0":
        print(f"❌ Unsupported version: {headers.get('version')}")
        return

    if headers.get("algorithm") != "zip-base64-sha256":
        print(f"❌ Unsupported algorithm: {headers.get('algorithm')}")
        return

    zip_bytes = base64.b64decode(b64_body)

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        decompressed = zf.read("content.md")

    expected_sha = headers.get("sha256")
    actual_sha = hashlib.sha256(decompressed).hexdigest()
    if expected_sha and expected_sha != actual_sha:
        print("⚠️ SHA-256 mismatch!")
        print(f"Expected: {expected_sha}")
        print(f"Actual:   {actual_sha}")

    print("\n📄 Recovered Markdown content:\n")
    print("---")
    print(decompressed.decode("utf-8"))
