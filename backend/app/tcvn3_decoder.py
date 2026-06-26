"""
TCVN3 (Vietnamese ABC) to Unicode decoder.

The source dc*.txt files use a variant of TCVN3 where bytes 0xA7-0xAD
map to lowercase base vowels (đ, ă, â, ê, ô, ơ, ư), not uppercase.
This decoder uses a mapping table verified against known Vietnamese words
in the E:\\Ban Do source files (header row, owner names, addresses).

Verification method: the TXT header row contains known column names
("Thửa", "Tâm X", "Diện tích", "Loại đất", "Tên chủ sử dụng", "địa chỉ")
which pin down the byte-to-char mapping for each high byte.
"""
from io import StringIO

TCVN3_MAP = {
    0x80: 'À', 0x81: 'Ả', 0x82: 'Ã', 0x83: 'Á', 0x84: 'Ạ',
    0x85: 'Ă', 0x86: 'Ằ', 0x87: 'Ẳ', 0x88: 'Ẵ', 0x89: 'Ắ', 0x8A: 'Ặ',
    0x8B: 'Â', 0x8C: 'Ầ', 0x8D: 'Ứ', 0x8E: 'Ẫ', 0x8F: 'Ấ', 0x90: 'Ậ',

    0x91: 'È', 0x92: 'Ẻ', 0x93: 'Ẽ', 0x94: 'É', 0x95: 'Ẹ',
    0x96: 'Ê', 0x97: 'Ề', 0x98: 'Ể', 0x99: 'Ễ', 0x9A: 'Ế', 0x9B: 'Ệ',

    0x9C: 'Ì', 0x9D: 'Ỉ', 0x9E: 'Ĩ', 0x9F: 'Í', 0xA0: 'Ị',

    0xA1: 'Ò', 0xA2: 'Ỏ', 0xA3: 'Õ', 0xA4: 'Ó', 0xA5: 'Ọ', 0xA6: 'Ô',

    0xA7: 'đ', 0xA8: 'ă', 0xA9: 'â', 0xAA: 'ê',
    0xAB: 'ô', 0xAC: 'ơ', 0xAD: 'ư',

    0xAE: 'đ', 0xAF: 'Ỡ',
    0xB0: 'Ớ', 0xB1: 'Ợ', 0xB2: 'Ù', 0xB3: 'Ủ', 0xB4: 'Ũ',
    0xB5: 'à', 0xB6: 'ả', 0xB7: 'à',
    0xB8: 'á', 0xB9: 'ạ',
    0xBA: 'Ữ', 0xBB: 'Ứ', 0xBC: 'ô', 0xBD: 'Ỳ',
    0xBE: 'ậ', 0xBF: 'Ỹ', 0xC0: 'Ý', 0xC1: 'Ỵ', 0xC2: 'Đ',

    0xC3: 'à', 0xC4: 'ả', 0xC5: 'ã', 0xC6: 'ạ', 0xC7: 'ầ',
    0xC8: 'ằ', 0xC9: 'ẫ', 0xCA: 'ấ', 0xCB: 'ậ',
    0xCC: 'ớ', 0xCD: 'ợ', 0xCE: 'â', 0xCF: 'ầ', 0xD0: 'ẩ',
    0xD1: 'ẫ', 0xD2: 'ề', 0xD3: 'ê',
    0xD4: 'ễ', 0xD5: 'ế', 0xD6: 'ệ', 0xD7: 'ì', 0xD8: 'ỉ',
    0xD9: 'ê', 0xDA: 'ề', 0xDB: 'ể',
    0xDC: 'ĩ', 0xDD: 'í', 0xDE: 'ị',

    0xDF: 'ì', 0xE0: 'ỉ', 0xE1: 'ĩ', 0xE2: 'í', 0xE3: 'ấ',
    0xE4: 'ọ', 0xE5: 'ồ', 0xE6: 'ằ', 0xE7: 'ó', 0xE8: 'ố',
    0xE9: 'ộ', 0xEA: 'ờ', 0xEB: 'ở', 0xEC: 'ỡ', 0xED: 'ố',
    0xEE: 'ợ', 0xEF: 'ù',

    0xF0: 'ờ', 0xF1: 'ủ', 0xF2: 'ã', 0xF3: 'ú', 0xF4: 'ụ',
    0xF5: 'ù', 0xF6: 'ử', 0xF7: 'ũ', 0xF8: 'ứ',
    0xF9: 'ĩ', 0xFA: 'ư', 0xFB: 'ừ', 0xFC: 'ử',
    0xFD: 'ỵ', 0xFE: 'ứ', 0xFF: 'ự',
}


def decode_tcvn3(byte_data: bytes) -> str:
    """Decode TCVN3-encoded bytes to a Unicode string."""
    result = []
    for byte_val in byte_data:
        if byte_val < 0x80:
            result.append(chr(byte_val))
        elif byte_val in TCVN3_MAP:
            result.append(TCVN3_MAP[byte_val])
        else:
            result.append(chr(byte_val))
    return ''.join(result)


def sanitize_text(text: str) -> str:
    """Sanitize decoded text: fix casing for names, strip anomalous characters."""
    if not text:
        return text
    s = text.strip()
    s = s.replace('\x00', '').replace('\r', '')
    if not s:
        return s
    if s[0].islower():
        s = s[0].upper() + s[1:]
    return s


def open_tcvn3(filepath: str, mode: str = 'r'):
    """Open a TCVN3-encoded file, returning a StringIO for text mode."""
    if 'b' in mode:
        return open(filepath, mode)
    with open(filepath, 'rb') as f:
        raw_data = f.read()
    return StringIO(decode_tcvn3(raw_data))
