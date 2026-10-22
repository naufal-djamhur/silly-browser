import argparse
import json
import sys
from custom_browser.browser_manager import install_browser, browser_path, browser_status


def main():
    parser = argparse.ArgumentParser(description='Install or locate a pinned Silly Browser runtime.')
    parser.add_argument('command', choices=['install', 'path', 'status'])
    args = parser.parse_args()
    try:
        if args.command == 'install':
            print(install_browser())
        elif args.command == 'path':
            print(browser_path())
        else:
            print(json.dumps(browser_status(), indent=2))
        return 0
    except (ValueError, RuntimeError, OSError) as error:
        print(str(error), file=sys.stderr)
        return 1
