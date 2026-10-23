"""Read boolean detection details from saved page text without executing it."""
import json


def parse_detection_details(text):
    """Return a rendered isBot/details object, or None when not available.

    The reviewed example's dynamic JS regular expression loses its whitespace
    escape. Parse the rendered JSON instead; do not infer missing flags or read
    other page fields such as IP addresses or browser identifiers.
    """
    if len(text) > 1024 * 1024:
        raise ValueError('Captured page text exceeds 1,048,576 characters')
    decoder = json.JSONDecoder()
    offset = 0
    for _ in range(256):
        offset = text.find('{', offset)
        if offset < 0:
            return None
        try:
            value, _ = decoder.raw_decode(text, offset)
        except (ValueError, RecursionError):
            offset += 1
            continue
        if (isinstance(value, dict) and type(value.get('isBot')) is bool
                and isinstance(value.get('details'), dict)):
            checks = {
                key: flag for key, flag in value['details'].items()
                if type(flag) is bool
            }
            return {'isBot': value['isBot'], 'checks': checks} if checks else None
        offset += 1
    return None
