"""
Builds favicon.ico (and a PNG for avatars) from the site's inline SVG favicon.

The icon is pure geometry on a 16x16 grid - an orange field with two dark squares at
(3,3) and (9,9), each 4 wide - so it is drawn directly at each size rather than run
through an SVG rasteriser. Every size is a whole multiple of 16, which keeps the edges
exactly on pixel boundaries: no blur, no half-covered pixels.
"""
import struct
import zlib

ORANGE = (0xF9, 0x73, 0x16, 0xFF)   # #f97316
DARK = (0x09, 0x09, 0x0F, 0xFF)     # #09090f
BLOCKS = ((3, 3, 4, 4), (9, 9, 4, 4))  # x, y, w, h on the 16x16 grid
SIZES = (16, 32, 48, 64, 128, 256)


def pixels(size):
    """RGBA rows, top to bottom."""
    k = size // 16
    rows = []
    for y in range(size):
        row = []
        for x in range(size):
            colour = ORANGE
            for bx, by, bw, bh in BLOCKS:
                if bx * k <= x < (bx + bw) * k and by * k <= y < (by + bh) * k:
                    colour = DARK
                    break
            row.append(colour)
        rows.append(row)
    return rows


def png_bytes(rows):
    size = len(rows)
    raw = bytearray()
    for row in rows:
        raw.append(0)  # filter: none
        for r, g, b, a in row:
            raw += bytes((r, g, b, a))

    def chunk(tag, data):
        out = struct.pack(">I", len(data)) + tag + data
        return out + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
            + chunk(b"IEND", b""))


def dib_bytes(rows):
    """A 32-bit bottom-up DIB with an empty AND mask, as classic .ico entries use."""
    size = len(rows)
    pixel_data = bytearray()
    for row in reversed(rows):
        for r, g, b, a in row:
            pixel_data += bytes((b, g, r, a))  # BGRA

    mask_row = ((size + 31) // 32) * 4  # 1 bit per pixel, rows padded to 4 bytes
    mask = bytearray(mask_row * size)   # all zero: nothing is transparent

    header = struct.pack(
        "<IiiHHIIiiII",
        40,             # header size
        size,           # width
        size * 2,       # height: colour data plus mask
        1,              # planes
        32,             # bits per pixel
        0,              # BI_RGB
        len(pixel_data) + len(mask),
        0, 0, 0, 0,
    )
    return header + bytes(pixel_data) + bytes(mask)


def build_ico(path):
    entries = []
    for size in SIZES:
        rows = pixels(size)
        # Small sizes as DIB for the widest compatibility, large ones as PNG so the
        # file does not balloon (a 256x256 DIB alone is 256 kB).
        data = dib_bytes(rows) if size <= 48 else png_bytes(rows)
        entries.append((size, data))

    offset = 6 + 16 * len(entries)
    directory = b""
    body = b""
    for size, data in entries:
        directory += struct.pack(
            "<BBBBHHII",
            size if size < 256 else 0,   # 0 means 256
            size if size < 256 else 0,
            0, 0, 1, 32,
            len(data), offset,
        )
        body += data
        offset += len(data)

    with open(path, "wb") as f:
        f.write(struct.pack("<HHH", 0, 1, len(entries)) + directory + body)
    return sum(len(d) for _, d in entries) + 6 + 16 * len(entries)


def build_png(path, size):
    data = png_bytes(pixels(size))
    with open(path, "wb") as f:
        f.write(data)
    return len(data)


if __name__ == "__main__":
    import sys
    out = sys.argv[1]
    print("favicon.ico :", build_ico(out + "/favicon.ico"), "bytes",
          "(" + ", ".join(str(s) for s in SIZES) + ")")
    print("512 png     :", build_png(out + "/vibmc-icon-512.png", 512), "bytes")
