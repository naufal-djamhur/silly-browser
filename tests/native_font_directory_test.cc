// Copyright 2026 Custom Browser contributors. MIT license.
#include "../engine/native_font_directory_win.h"
#include <cassert>
#include <iostream>

int wmain(int argc, wchar_t** argv) {
  assert(argc == 3);
  const std::wstring valid = argv[1], invalid = argv[2];
  const auto files = custom_browser::ReadFontDirectory(valid);
  assert(files && files->size() == 1);
  assert(!custom_browser::ReadFontDirectory(L"relative-fonts"));
  assert(!custom_browser::ReadFontDirectory(valid + L"\\..\\fonts"));
  assert(!custom_browser::ReadFontDirectory(invalid));
  std::cout << "Native Windows font-directory bounds and DirectWrite format checks passed\n";
}
