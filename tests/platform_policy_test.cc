#include "../engine/platform_policy.h"
#include <cassert>
#include <iostream>
int main() {
  assert(!custom_browser::LookupPlatform("native"));
  assert(custom_browser::IsSupportedPlatform("native"));
  assert(!custom_browser::IsSupportedPlatform("android"));
  auto win = custom_browser::LookupPlatform("windows");
  assert(win && win->navigator_platform == "Win32" && win->hint_platform == "Windows");
  assert(custom_browser::LookupPlatform("linux")->hint_platform_version.empty());
  assert(custom_browser::LookupPlatform("macos")->navigator_platform == "MacIntel");
  assert(custom_browser::IsPlatformVersion("15.0.0"));
  for (auto invalid : {"", "1", ".1.0", "1..0", "1.2.", "1.2.3.4", "-1.0.0", "1.a.0"})
    assert(!custom_browser::IsPlatformVersion(invalid));
  std::cout << "Native platform policy tests passed\n";
}
