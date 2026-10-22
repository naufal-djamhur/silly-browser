import argparse
import json
import sys
from . import get_font_directory,verify_fonts


def main():
    parser=argparse.ArgumentParser(description='Locate or verify the optional native font pack.')
    parser.add_argument('command',choices=['path','verify'],nargs='?',default='path')
    args=parser.parse_args()
    try:
        print(get_font_directory() if args.command=='path' else json.dumps(verify_fonts(),indent=2))
        return 0
    except (OSError,RuntimeError) as error:
        print(str(error),file=sys.stderr)
        return 1


if __name__=='__main__':raise SystemExit(main())
