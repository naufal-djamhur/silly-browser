#include "../engine/seed_policy.h"
#include <cassert>
#include <iostream>
int main() {
  assert(custom_browser::ParseSeed("0") == 0);
  assert(custom_browser::ParseSeed("18446744073709551615") == UINT64_MAX);
  for (auto invalid : {"", "-1", "+1", "1.0", "1x", " 1", "18446744073709551616"})
    assert(!custom_browser::ParseSeed(invalid));
  std::cout << "Native seed parser boundaries passed\n";
}
